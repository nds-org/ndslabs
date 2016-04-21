// Copyright © 2016 National Data Service
package main

import (
	"crypto/rand"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	etcd "github.com/ndslabs/apiserver/etcd"
	kube "github.com/ndslabs/apiserver/kube"
	api "github.com/ndslabs/apiserver/types"
	gcfg "gopkg.in/gcfg.v1"
	k8api "k8s.io/kubernetes/pkg/api"

	"github.com/StephanDollberg/go-json-rest-middleware-jwt"
	"github.com/ant0ine/go-json-rest/rest"
	"github.com/golang/glog"
)

type Server struct {
	etcd      *etcd.EtcdHelper
	kube      *kube.KubeHelper
	Namespace string
	local     bool
	volDir    string
	hostname  string
	jwt       *jwt.JWTMiddleware
}

type Config struct {
	Server struct {
		Port         string
		Origin       string
		VolDir       string
		SpecsDir     string
		VolumeSource string
		SSLKey       string
		SSLCert      string
		Timeout      int
	}
	Etcd struct {
		Address string
	}
	Kubernetes struct {
		Address  string
		Username string
		Password string
	}
}

func main() {

	var confPath, adminPasswd string
	flag.StringVar(&confPath, "conf", "apiserver.conf", "Configuration path")
	flag.StringVar(&adminPasswd, "passwd", "admin", "Admin usder password")
	flag.Parse()
	cfg := Config{}
	err := gcfg.ReadFileInto(&cfg, confPath)
	if err != nil {
		glog.Error(err)
		os.Exit(-1)
	}

	if cfg.Server.Port == "" {
		cfg.Server.Port = "30001"
	}
	if cfg.Etcd.Address == "" {
		cfg.Etcd.Address = "localhost:4001"
	}
	if cfg.Kubernetes.Address == "" {
		cfg.Kubernetes.Address = "localhost:6443"
	}

	hostname, err := os.Hostname()
	if err != nil {
		glog.Fatal(err)
	}

	etcd, err := etcd.NewEtcdHelper(cfg.Etcd.Address)
	if err != nil {
		glog.Errorf("Etcd not available: %s\n", err)
		glog.Fatal(err)
	}

	kube, err := kube.NewKubeHelper(cfg.Kubernetes.Address,
		cfg.Kubernetes.Username, cfg.Kubernetes.Password)
	if err != nil {
		glog.Errorf("Kubernetes API server not available\n")
		glog.Fatal(err)
	}

	server := Server{}
	server.hostname = hostname
	server.etcd = etcd
	server.kube = kube
	server.volDir = cfg.Server.VolDir
	server.start(cfg, adminPasswd)
}

func (s *Server) start(cfg Config, adminPasswd string) {

	glog.Infof("Starting NDS Labs API server (%s %s)", VERSION, BUILD_DATE)
	glog.Infof("etcd %s ", cfg.Etcd.Address)
	glog.Infof("kube-apiserver %s", cfg.Kubernetes.Address)
	glog.Infof("volume dir %s", cfg.Server.VolDir)
	glog.Infof("specs dir %s", cfg.Server.SpecsDir)
	glog.Infof("port %s", cfg.Server.Port)
	os.MkdirAll(cfg.Server.VolDir, 0700)

	api := rest.NewApi()
	api.Use(rest.DefaultDevStack...)

	if len(cfg.Server.Origin) > 0 {
		glog.Infof("CORS origin %s\n", cfg.Server.Origin)

		api.Use(&rest.CorsMiddleware{
			RejectNonCorsRequests: false,
			OriginValidator: func(origin string, request *rest.Request) bool {
				return origin == cfg.Server.Origin
			},
			AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},
			AllowedHeaders: []string{
				"Accept", "Content-Type", "X-Custom-Header", "Origin", "accept", "authorization"},
			AccessControlAllowCredentials: true,
			AccessControlMaxAge:           3600,
		})
	}

	timeout := time.Minute * 30
	if cfg.Server.Timeout > 0 {
		timeout = time.Minute * time.Duration(cfg.Server.Timeout)
	}
	glog.Infof("session timeout %s", timeout)

	jwt := &jwt.JWTMiddleware{
		Key:        []byte(s.hostname),
		Realm:      "ndslabs",
		Timeout:    timeout,
		MaxRefresh: time.Hour * 24,
		Authenticator: func(userId string, password string) bool {
			if userId == "admin" && password == adminPasswd {
				return true
			} else {
				project, err := s.etcd.GetProject(userId)
				if err != nil {
					glog.Error(err)
					return false
				} else {
					return project.Namespace == userId && project.Password == password
				}
			}
		},
		Authorizator: func(userId string, request *rest.Request) bool {
			payload := request.Env["JWT_PAYLOAD"].(map[string]interface{})

			if payload["server"] == s.hostname {
				return true
			} else {
				return false
			}
		},
		PayloadFunc: func(userId string) map[string]interface{} {
			payload := make(map[string]interface{})
			if userId == "admin" {
				payload["admin"] = true
			}
			payload["server"] = s.hostname
			payload["user"] = userId
			return payload
		},
	}
	s.jwt = jwt

	api.Use(&rest.IfMiddleware{
		Condition: func(request *rest.Request) bool {
			return request.URL.Path != "/authenticate" && request.URL.Path != "/version" && request.URL.Path != "/register"
		},
		IfTrue: jwt,
	})

	router, err := rest.MakeRouter(
		rest.Get("/", GetPaths),
		rest.Get("/version", Version),
		rest.Post("/authenticate", jwt.LoginHandler),
		rest.Delete("/authenticate", s.Logout),
		rest.Get("/check_token", s.CheckToken),
		rest.Get("/refresh_token", jwt.RefreshHandler),
		rest.Get("/projects", s.GetAllProjects),
		rest.Post("/projects/", s.PostProject),
		rest.Post("/register", s.PostProject),
		rest.Put("/projects/:pid", s.PutProject),
		rest.Get("/projects/:pid", s.GetProject),
		rest.Delete("/projects/:pid", s.DeleteProject),
		rest.Get("/services", s.GetAllServices),
		rest.Post("/services", s.PostService),
		rest.Put("/services/:key", s.PutService),
		rest.Get("/services/:key", s.GetService),
		rest.Delete("/services/:key", s.DeleteService),
		rest.Get("/configs", s.GetConfigs),
		rest.Get("/projects/:pid/stacks", s.GetAllStacks),
		rest.Post("/projects/:pid/stacks", s.PostStack),
		rest.Put("/projects/:pid/stacks/:sid", s.PutStack),
		rest.Get("/projects/:pid/stacks/:sid", s.GetStack),
		rest.Delete("/projects/:pid/stacks/:sid", s.DeleteStack),
		rest.Get("/projects/:pid/volumes", s.GetAllVolumes),
		rest.Post("/projects/:pid/volumes", s.PostVolume),
		rest.Put("/projects/:pid/volumes/:vid", s.PutVolume),
		rest.Get("/projects/:pid/volumes/:vid", s.GetVolume),
		rest.Delete("/projects/:pid/volumes/:vid", s.DeleteVolume),
		rest.Get("/projects/:pid/start/:sid", s.StartStack),
		rest.Get("/projects/:pid/stop/:sid", s.StopStack),
		rest.Get("/projects/:pid/logs/:ssid", s.GetLogs),
	)

	if err != nil {
		glog.Fatal(err)
	}
	api.SetApp(router)

	if len(cfg.Server.SpecsDir) > 0 {
		glog.Infof("Loading service specs from %s\n", cfg.Server.SpecsDir)
		err = s.loadSpecs(cfg.Server.SpecsDir)
		if err != nil {
			glog.Warningf("Error loading specs: %s\n", err)
		}
	}

	go s.initExistingProjects()

	glog.Infof("Listening on %s", cfg.Server.Port)
	if len(cfg.Server.SSLCert) > 0 {
		glog.Fatal(http.ListenAndServeTLS(":"+cfg.Server.Port,
			cfg.Server.SSLCert, cfg.Server.SSLKey, api.MakeHandler()))
	} else {
		glog.Fatal(http.ListenAndServe(":"+cfg.Server.Port, api.MakeHandler()))
	}
}

func (s *Server) initExistingProjects() {
	projects, err := s.etcd.GetProjects()
	if err != nil {
		glog.Error(err)
		return
	}

	for _, project := range *projects {
		if !s.kube.NamespaceExists(project.Namespace) {
			s.kube.CreateNamespace(project.Namespace)
		}
		stacks, err := s.etcd.GetStacks(project.Namespace)
		if err != nil {
			glog.Error(err)
		}
		for _, stack := range *stacks {

			if stack.Status == "starting" || stack.Status == "started" {
				_, err = s.startStack(project.Namespace, &stack)
				if err != nil {
					glog.Errorf("Error starting stack %s %s\n", project.Namespace, stack.Id)
					glog.Error(err)
				}
			} else if stack.Status == "stopping" {
				_, err = s.stopStack(project.Namespace, stack.Id)
				if err != nil {
					glog.Errorf("Error stopping stack %s %s\n", project.Namespace, stack.Id)
					glog.Error(err)
				}
			}
		}
	}
}

func GetPaths(w rest.ResponseWriter, r *rest.Request) {
	paths := []string{}
	paths = append(paths, "/version")
	paths = append(paths, "/authenticate")
	paths = append(paths, "/projects")
	paths = append(paths, "/services")
	paths = append(paths, "/configs")
	w.WriteJson(&paths)
}

func Version(w rest.ResponseWriter, r *rest.Request) {
	w.WriteJson(fmt.Sprintf("%s %s", VERSION, BUILD_DATE))
}

func (s *Server) CheckToken(w rest.ResponseWriter, r *rest.Request) {
	w.WriteHeader(http.StatusOK)
}

func (s *Server) Logout(w rest.ResponseWriter, r *rest.Request) {
	w.WriteHeader(http.StatusOK)
}

func (s *Server) GetAllProjects(w rest.ResponseWriter, r *rest.Request) {

	if !s.IsAdmin(r) {
		rest.Error(w, "", http.StatusUnauthorized)
		return
	}

	projects, err := s.etcd.GetProjects()
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		w.WriteJson(&err)
	} else {
		w.WriteJson(&projects)
	}
}

func (s *Server) getUser(r *rest.Request) string {
	payload := r.Env["JWT_PAYLOAD"].(map[string]interface{})
	return payload["user"].(string)
}

func (s *Server) IsAdmin(r *rest.Request) bool {
	payload := r.Env["JWT_PAYLOAD"].(map[string]interface{})
	if payload["admin"] == true {
		return true
	} else {
		return false
	}
}

func (s *Server) GetProject(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")

	// Check IsAdmin or pid = current user
	if !(s.IsAdmin(r) || s.getUser(r) == pid) {
		rest.Error(w, "", http.StatusUnauthorized)
		return
	}

	project, err := s.etcd.GetProject(pid)
	if err != nil {
		rest.NotFound(w, r)
	} else {
		//project.Password = ""
		w.WriteJson(project)
	}
}

func (s *Server) PostProject(w rest.ResponseWriter, r *rest.Request) {

	/*
		if !s.IsAdmin(r) {
			rest.Error(w, "", http.StatusUnauthorized)
			return
		}
	*/

	project := api.Project{}
	err := r.DecodeJsonPayload(&project)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if s.projectExists(project.Namespace) {
		w.WriteHeader(http.StatusConflict)
		return
	}

	_, err = s.kube.CreateNamespace(project.Namespace)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = s.etcd.PutProject(project.Namespace, &project)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteJson(&project)
}

func (s *Server) PutProject(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")

	// Check IsAdmin or pid = current user
	if !(s.IsAdmin(r) || s.getUser(r) == pid) {
		rest.Error(w, "", http.StatusUnauthorized)
		return
	}

	project := api.Project{}
	err := r.DecodeJsonPayload(&project)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = s.etcd.PutProject(pid, &project)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteJson(&project)
}

func (s *Server) DeleteProject(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")

	glog.V(4).Infof("DeleteProject %s", pid)

	if !s.IsAdmin(r) {
		rest.Error(w, "", http.StatusUnauthorized)
		return
	}

	if !s.projectExists(pid) {
		rest.NotFound(w, r)
		return
	}

	_, err := s.kube.DeleteNamespace(pid)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = s.etcd.DeleteProject(pid)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (s *Server) GetAllServices(w rest.ResponseWriter, r *rest.Request) {

	services, err := s.etcd.GetServices()
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteJson(&services)
}

func (s *Server) GetService(w rest.ResponseWriter, r *rest.Request) {
	key := r.PathParam("key")
	glog.V(4).Infof("GetService %s\n", key)

	if !s.serviceExists(key) {
		rest.NotFound(w, r)
		return
	}
	spec, err := s.etcd.GetServiceSpec(key)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	} else {
		w.WriteJson(&spec)
	}
}

func (s *Server) PostService(w rest.ResponseWriter, r *rest.Request) {

	if !s.IsAdmin(r) {
		rest.Error(w, "", http.StatusUnauthorized)
		return
	}

	service := api.ServiceSpec{}
	err := r.DecodeJsonPayload(&service)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = s.etcd.PutService(service.Key, &service)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	glog.V(1).Infof("Added service %s\n", service.Key)
	w.WriteHeader(http.StatusOK)
}

func (s *Server) PutService(w rest.ResponseWriter, r *rest.Request) {
	key := r.PathParam("key")

	if !s.IsAdmin(r) {
		rest.Error(w, "", http.StatusUnauthorized)
		return
	}

	service := api.ServiceSpec{}
	err := r.DecodeJsonPayload(&service)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = s.etcd.PutService(key, &service)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	glog.V(1).Infof("Updated service %s\n", key)
	w.WriteJson(&service)
}

func (s *Server) DeleteService(w rest.ResponseWriter, r *rest.Request) {
	key := r.PathParam("key")

	if !s.IsAdmin(r) {
		rest.Error(w, "", http.StatusUnauthorized)
		return
	}

	if !s.serviceExists(key) {
		rest.Error(w, "No such service", http.StatusNotFound)
		return
	}

	if s.serviceIsDependency(key) > 0 {
		glog.Warningf("Cannot delete service spec %s because it is required by one or more services\n", key)
		rest.Error(w, "Required by another service", http.StatusConflict)
		return
	}

	if s.serviceInUse(key) > 0 {
		glog.Warningf("Cannot delete service spec %s because it is in use by one or more projects\n", key)
		rest.Error(w, "Service is in use", http.StatusConflict)
		return
	}

	err := s.etcd.DeleteService(key)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	glog.V(1).Infof("Deleted service %s\n", key)
	w.WriteHeader(http.StatusOK)
}

func (s *Server) serviceInUse(sid string) int {
	inUse := 0
	projects, _ := s.etcd.GetProjects()
	for _, project := range *projects {
		stacks, _ := s.etcd.GetStacks(project.Namespace)
		for _, stack := range *stacks {
			for _, service := range stack.Services {
				if service.Service == sid {
					inUse++
				}
			}
		}
	}
	return inUse
}

func (s *Server) GetAllStacks(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")

	stacks, err := s.getStacks(pid)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		w.WriteJson(&err)
	} else {
		w.WriteJson(&stacks)
	}
}

func (s *Server) getStacks(pid string) (*[]api.Stack, error) {

	stacks := []api.Stack{}
	stks, err := s.etcd.GetStacks(pid)
	if err == nil {
		for _, stack := range *stks {
			stack, _ := s.getStackWithStatus(pid, stack.Id)
			stacks = append(stacks, *stack)
		}
	}
	return &stacks, nil
}

func (s *Server) isStackStopped(pid string, ssid string) bool {
	sid := ssid[0:strings.LastIndex(ssid, "-")]
	stack, _ := s.etcd.GetStack(pid, sid)

	if stack != nil && stack.Status == stackStatus[Stopped] {
		return true
	} else {
		return false
	}
}

func (s *Server) getStackService(pid string, ssid string) *api.StackService {
	if strings.Index(ssid, "-") < 0 {
		return nil
	}
	sid := ssid[0:strings.LastIndex(ssid, "-")]
	stack, _ := s.etcd.GetStack(pid, sid)
	if stack == nil {
		return nil
	}

	for _, stackService := range stack.Services {
		if ssid == stackService.Id {
			return &stackService
		}
	}
	return nil
}

func (s *Server) attachmentExists(pid string, ssid string) bool {
	volumes, _ := s.etcd.GetVolumes(pid)
	if volumes == nil {
		return false
	}

	exists := false
	for _, volume := range *volumes {
		if volume.Attached == ssid {
			exists = true
			break
		}
	}
	return exists
}

func (s *Server) volumeExists(pid string, name string) bool {
	volumes, _ := s.etcd.GetVolumes(pid)
	if volumes == nil {
		return false
	}

	exists := false
	for _, volume := range *volumes {
		if volume.Name == name {
			exists = true
			break
		}
	}
	return exists
}

func (s *Server) projectExists(pid string) bool {
	projects, _ := s.etcd.GetProjects()
	if projects == nil {
		return false
	}

	exists := false
	for _, project := range *projects {
		if project.Namespace == pid {
			exists = true
			break
		}
	}
	return exists
}

func (s *Server) stackServiceExists(pid string, id string) bool {
	stacks, _ := s.getStacks(pid)
	if stacks == nil {
		return false
	}

	exists := false
	for _, stack := range *stacks {
		for _, stackService := range stack.Services {
			if stackService.Id == id {
				exists = true
				break
			}
		}
	}
	return exists
}

func (s *Server) stackExists(pid string, name string) bool {
	stacks, _ := s.getStacks(pid)
	if stacks == nil {
		return false
	}

	exists := false
	for _, stack := range *stacks {
		if stack.Name == name {
			exists = true
			break
		}
	}
	return exists
}

func (s *Server) serviceIsDependency(sid string) int {
	services, _ := s.etcd.GetServices()
	dependencies := 0
	for _, service := range *services {
		for _, dependency := range service.Dependencies {
			if dependency.DependencyKey == sid {
				dependencies++
			}
		}
	}
	return dependencies
}

func (s *Server) serviceExists(sid string) bool {
	service, _ := s.etcd.GetServiceSpec(sid)
	if service == nil {
		return false
	} else {
		return true
	}
}

func (s *Server) GetStack(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	sid := r.PathParam("sid")

	stack, err := s.getStackWithStatus(pid, sid)
	if stack == nil {
		rest.NotFound(w, r)
		return
	}

	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	} else {
		w.WriteJson(&stack)
	}
}

func (s *Server) PostStack(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")

	stack := api.Stack{}
	err := r.DecodeJsonPayload(&stack)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	glog.V(4).Infof("Adding stack %s %s\n", stack.Key, stack.Name)
	if s.stackExists(pid, stack.Name) {
		w.WriteHeader(http.StatusConflict)
		return
	}

	_, err = s.etcd.GetServiceSpec(stack.Key)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	sid := s.kube.GenerateName(5)
	stack.Id = sid
	stack.Status = stackStatus[Stopped]

	for i := range stack.Services {
		stackService := &stack.Services[i]
		stackService.Id = fmt.Sprintf("%s-%s", sid, stackService.Service)
	}

	err = s.etcd.PutStack(pid, stack.Id, &stack)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteJson(&stack)
}

func (s *Server) PutStack(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	sid := r.PathParam("sid")

	stack := api.Stack{}

	err := r.DecodeJsonPayload(&stack)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for i := range stack.Services {
		stackService := &stack.Services[i]
		stackService.Id = fmt.Sprintf("%s-%s", sid, stackService.Service)
	}

	stack.Status = stackStatus[Stopped]
	err = s.etcd.PutStack(pid, sid, &stack)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteJson(&stack)
}

func (s *Server) DeleteStack(w rest.ResponseWriter, r *rest.Request) {

	pid := r.PathParam("pid")
	sid := r.PathParam("sid")

	stack, err := s.etcd.GetStack(pid, sid)
	if stack == nil {
		rest.NotFound(w, r)
		return
	}

	if stack.Status == stackStatus[Started] ||
		stack.Status == stackStatus[Starting] {
		// Can't stop a running stack
		w.WriteHeader(http.StatusConflict)
		//	s.stopStack(pid, sid)
		return
	}

	err = s.etcd.DeleteStack(pid, sid)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	volumes, err := s.etcd.GetVolumes(pid)
	for _, volume := range *volumes {
		for _, ss := range stack.Services {
			if volume.Attached == ss.Id {
				glog.V(4).Infof("Detaching volume %s\n", volume.Id)
				volume.Attached = ""
				volume.Status = "available"
				s.etcd.PutVolume(pid, volume.Id, volume)
				// detach the volume
			}
		}
	}

	w.WriteHeader(http.StatusOK)
}

func (s *Server) startStackService(serviceKey string, pid string, stack *api.Stack, addrPortMap *map[string]kube.ServiceAddrPort) {

	service, _ := s.etcd.GetServiceSpec(serviceKey)
	for _, dep := range service.Dependencies {
		if dep.Required {
			glog.V(4).Infof("Starting required dependency %s\n", dep.DependencyKey)
			s.startController(pid, dep.DependencyKey, stack, addrPortMap)
		} else {
			s.startStackService(dep.DependencyKey, pid, stack, addrPortMap)
		}
	}
}

func (s *Server) startController(pid string, serviceKey string, stack *api.Stack, addrPortMap *map[string]kube.ServiceAddrPort) (bool, error) {

	var stackService *api.StackService
	found := false
	for i := range stack.Services {
		ss := &stack.Services[i]
		if ss.Service == serviceKey {
			stackService = ss
			found = true
		}
	}
	if !found {
		return false, nil
	}

	pods, _ := s.kube.GetPods(pid, "name", fmt.Sprintf("%s-%s", stack.Id, serviceKey))
	running := false
	for _, pod := range pods {
		if pod.Status.Phase == "Running" {
			running = true
		}
	}

	if running {
		glog.V(4).Infof("Controller %s already running\n", serviceKey)
		return true, nil
	}

	glog.V(4).Infof("Starting controller for %s\n", serviceKey)
	spec, _ := s.etcd.GetServiceSpec(serviceKey)

	sharedEnv := make(map[string]string)
	// Hack to allow for sharing configuration information between dependent services
	for _, depends := range spec.Dependencies {
		if depends.ShareConfig {
			// Get the stack service for the dependency, if present
			for i := range stack.Services {
				ss := &stack.Services[i]
				if ss.Service == depends.DependencyKey {
					// Found it. Now get it's config
					for key, value := range ss.Config {
						sharedEnv[key] = value
						glog.V(4).Infof("Adding env from %s  %s=%s\n", ss.Service, key, value)
					}
				}
			}
		}
	}

	name := fmt.Sprintf("%s-%s", stack.Id, spec.Key)
	template := s.kube.CreateControllerTemplate(pid, name, stack.Id, stackService, spec, addrPortMap, &sharedEnv)

	if len(spec.VolumeMounts) > 0 {
		k8vols := make([]k8api.Volume, 0)
		for _, mount := range spec.VolumeMounts {
			if mount.Name == "docker" {
				// Create a docker socket mount
				k8vol := k8api.Volume{}
				k8vol.Name = "docker"
				k8hostPath := k8api.HostPathVolumeSource{}
				k8hostPath.Path = "/var/run/docker.sock"
				k8vol.HostPath = &k8hostPath
				k8vols = append(k8vols, k8vol)
			}
		}

		k8vol := k8api.Volume{}
		k8vol.Name = stackService.Service
		glog.V(4).Infof("Need volume for %s \n", stackService.Service)

		volumes, _ := s.etcd.GetVolumes(pid)
		found := false
		for _, volume := range *volumes {
			if volume.Attached == stackService.Id {
				glog.V(4).Infof("Found volume %s\n", volume.Attached)
				found = true

				if volume.Format == "hostPath" {
					k8hostPath := k8api.HostPathVolumeSource{}
					k8hostPath.Path = s.volDir + "/" + volume.Id
					k8vol.HostPath = &k8hostPath
					k8vols = append(k8vols, k8vol)

					glog.V(4).Infof("Attaching %s\n", s.volDir+"/"+volume.Id)
				} else if volume.Format == "cinder" {
					k8cinder := k8api.CinderVolumeSource{}
					k8cinder.VolumeID = volume.Id
					k8cinder.FSType = "xfs"
					k8vol.Cinder = &k8cinder
					k8vols = append(k8vols, k8vol)
					glog.V(4).Infof("Attaching cinder %s\n", volume.Id)
				} else {
					glog.Warning("Invalid volume format\n")
				}
			}
		}
		if !found {
			glog.Warningf("Required volume not found, using emptyDir\n")
			k8empty := k8api.EmptyDirVolumeSource{}
			k8vol.EmptyDir = &k8empty
			k8vols = append(k8vols, k8vol)
		}
		template.Spec.Template.Spec.Volumes = k8vols
	}

	fmt.Printf("Starting controller %s\n", name)
	_, err := s.kube.StartController(pid, template)
	if err != nil {
		return false, err
	}

	// Give Kubernetes time to create the pods for the RC
	time.Sleep(time.Second * 3)

	// Wait for pods in ready state
	ready := 0
	failed := 0
	name = fmt.Sprintf("%s-%s", stack.Id, serviceKey)
	pods, _ = s.kube.GetPods(pid, "name", name)
	glog.V(4).Infof("Waiting for %d pod to be ready %s\n", len(pods), name)
	for (ready + failed) < len(pods) {
		for _, pod := range pods {
			if len(pod.Status.Conditions) > 0 {
				condition := pod.Status.Conditions[0]
				phase := pod.Status.Phase
				containerState := ""
				if len(pod.Status.ContainerStatuses) > 0 {
					state := pod.Status.ContainerStatuses[0].LastTerminationState
					switch {
					case state.Running != nil:
						containerState = "running"
					case state.Waiting != nil:
						containerState = "waiting"
					case state.Terminated != nil:
						containerState = "terminated"
					}
				}

				glog.V(4).Infof("Waiting for pod %s (%s=%s) [%s, %s] %d %d\n", pod.Name, condition.Type, condition.Status, phase, containerState, (ready + failed), len(pods))
				stackService.Status = string(pod.Status.Phase)
				if condition.Type == "Ready" && condition.Status == "True" {
					ready++
				} else if containerState == "terminated" {
					failed++
				} else {
					pods, _ = s.kube.GetPods(pid, "name", name)
					time.Sleep(time.Second * 3)
				}
			}
		}
	}

	if failed > 0 {
		return false, nil
	} else {
		return true, nil
	}
}

func (s *Server) StartStack(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	sid := r.PathParam("sid")

	stack, _ := s.etcd.GetStack(pid, sid)
	if stack == nil {
		rest.NotFound(w, r)
		return
	}
	glog.V(4).Infof("Starting stack %s", stack.Id)

	glog.V(4).Infof("Stack status %s\n", stack.Status)
	if stack.Status != stackStatus[Stopped] {
		// Can't start a stopping or started service
		glog.V(4).Infof("Can't start a service with status %s\n", stack.Status)
		w.WriteHeader(http.StatusConflict)
		return
	}

	stack, err := s.startStack(pid, stack)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteJson(&stack)
}

func (s *Server) startStack(pid string, stack *api.Stack) (*api.Stack, error) {

	sid := stack.Id
	stack.Status = stackStatus[Starting]
	s.etcd.PutStack(pid, sid, stack)

	stackServices := stack.Services

	// Start all Kubernetes services
	addrPortMap := make(map[string]kube.ServiceAddrPort)
	for _, stackService := range stackServices {
		spec, _ := s.etcd.GetServiceSpec(stackService.Service)

		if len(spec.Ports) > 0 {
			name := fmt.Sprintf("%s-%s", stack.Id, spec.Key)
			template := s.kube.CreateServiceTemplate(name, stack.Id, spec)

			svc, err := s.kube.GetService(pid, name)
			if svc == nil {
				glog.V(4).Infof("Starting Kubernetes service %s\n", name)
				svc, err = s.kube.StartService(pid, template)
				if err != nil {
					glog.Errorf("Error starting service %s\n", name)
					return nil, err
				}
			}
			if svc == nil {
				glog.V(4).Infof("Failed to start service service %s\n", name)
				continue
			}
			glog.V(4).Infof("Started service %s\n", name)
			addrPort := kube.ServiceAddrPort{
				Name:     stackService.Service,
				Host:     svc.Spec.ClusterIP,
				Port:     svc.Spec.Ports[0].Port,
				NodePort: svc.Spec.Ports[0].NodePort,
			}
			addrPortMap[stackService.Service] = addrPort
		}
	}

	// For each stack service, if no dependencies or dependency == started,
	// start service. Otherwise wait
	started := map[string]int{}
	for len(started) < len(stackServices) {
		stack, _ = s.getStackWithStatus(pid, sid)
		for _, stackService := range stack.Services {
			if started[stackService.Service] == 1 {
				continue
			}
			svc, _ := s.etcd.GetServiceSpec(stackService.Service)

			numDeps := 0
			startedDeps := 0
			for _, dep := range svc.Dependencies {
				for _, ss := range stack.Services {
					if dep.DependencyKey == ss.Service {
						numDeps++
						if ss.Status == "ready" {
							startedDeps++
						}
					}
				}
			}
			if numDeps == 0 || startedDeps == numDeps {
				go s.startController(pid, stackService.Service, stack, &addrPortMap)
				started[stackService.Service] = 1
			}
		}
		time.Sleep(time.Second * 3)
	}

	ready := map[string]int{}
	errors := map[string]int{}
	for len(ready) < len(started) && len(errors) == 0 {
		stack, _ = s.getStackWithStatus(pid, sid)
		for _, stackService := range stack.Services {
			if stackService.Status == "ready" {
				ready[stackService.Service] = 1
			}
			if stackService.Status == "error" {
				errors[stackService.Service] = 1
			}
		}
		time.Sleep(time.Second * 3)
	}

	stack, _ = s.getStackWithStatus(pid, sid)
	stack.Status = "started"
	for _, stackService := range stack.Services {
		if stackService.Status == "error" {
			stack.Status = "error"
		}
	}

	s.etcd.PutStack(pid, sid, stack)
	glog.V(4).Infof("Stack %s started\n", sid)

	return stack, nil
}

func (s *Server) getStackWithStatus(pid string, sid string) (*api.Stack, error) {

	stack, _ := s.etcd.GetStack(pid, sid)
	if stack == nil {
		return nil, nil
	}

	// Get the pods for this stack
	podStatus := make(map[string]string)

	pods, _ := s.kube.GetPods(pid, "stack", sid)
	for _, pod := range pods {
		label := pod.Labels["service"]
		if len(pod.Status.Conditions) > 0 {
			// Node Condition describes the condition of a running node. Only condition it "Ready"
			condition := pod.Status.Conditions[0]
			phase := pod.Status.Phase
			containerState := ""
			if len(pod.Status.ContainerStatuses) > 0 {

				state := pod.Status.ContainerStatuses[0].LastTerminationState
				switch {
				case state.Running != nil:
					containerState = "running"
				case state.Waiting != nil:
					containerState = "waiting"
				case state.Terminated != nil:
					containerState = "terminated"
				}
			}

			status := ""
			if phase == "Running" {
				if condition.Type == "Ready" && condition.Status == "True" {
					status = "ready"
				} else if containerState == "running" || containerState == "waiting" {
					status = "starting"
				} else if containerState == "terminated" {
					status = "error"
				} else if containerState == "" {
					status = stack.Status
				}
			} else if phase == "Pending" {
				status = "waiting"
			} else if phase == "Terminated" {
				status = "stopped"
			} else if phase == "Failed" {
				status = "failed"
			}

			glog.V(4).Infof("Pod Status: label=%s phase=%s containerState=%s status=%s\n", label, phase, containerState, status)
			// Final status
			podStatus[label] = status
		}
	}

	k8services, _ := s.kube.GetServices(pid, sid)
	endpoints := make(map[string]api.Endpoint)
	for _, k8service := range k8services {
		label := k8service.Labels["service"]
		glog.V(4).Infof("Service : %s %s (%s)\n", k8service.Name, k8service.Spec.Type, label)
		endpoint := api.Endpoint{}
		endpoint.InternalIP = k8service.Spec.ClusterIP
		endpoint.Port = k8service.Spec.Ports[0].Port
		endpoint.Protocol = strings.ToLower(string(k8service.Spec.Ports[0].Protocol))
		endpoint.NodePort = k8service.Spec.Ports[0].NodePort
		endpoints[label] = endpoint
	}

	for i := range stack.Services {
		stackService := &stack.Services[i]
		stackService.Endpoints = []api.Endpoint{}

		glog.V(4).Infof("Stack Service %s %s\n", stackService.Service, podStatus[stackService.Service])

		stackService.Status = podStatus[stackService.Service]
		endpoint, ok := endpoints[stackService.Service]
		if ok {
			// Get the port protocol for the service endpoint
			svc, err := s.etcd.GetServiceSpec(stackService.Service)
			if err != nil {
				glog.Error(err)
			}
			for _, port := range svc.Ports {
				if port.Port == endpoint.Port {
					endpoint.Protocol = port.Protocol
				}
			}

			stackService.Endpoints = append(stackService.Endpoints, endpoint)
		}
	}

	return stack, nil
}

func (s *Server) StopStack(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	sid := r.PathParam("sid")

	stack, err := s.etcd.GetStack(pid, sid)
	if stack == nil {
		rest.NotFound(w, r)
		return
	}
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	stack, err = s.stopStack(pid, sid)
	if err == nil {
		glog.V(4).Infof("Stack %s stopped \n", sid)
		w.WriteJson(&stack)
	} else {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
	}

}

func (s *Server) stopStack(pid string, sid string) (*api.Stack, error) {

	path := "/projects/" + pid + "/stacks/" + sid
	glog.V(4).Infof("Stopping stack %s\n", path)

	stack, _ := s.etcd.GetStack(pid, sid)

	glog.V(4).Infof("Stack status %s\n", stack.Status)
	if stack.Status == stackStatus[Stopped] {
		// Can't stop a stopped service
		glog.V(4).Infof("Can't stop a stopped service")
		return stack, nil
	}

	stack.Status = stackStatus[Stopping]
	s.etcd.PutStack(pid, sid, stack)

	// For each stack service, stop dependent services first.
	stopped := map[string]int{}

	for len(stopped) < len(stack.Services) {
		stack, _ = s.getStackWithStatus(pid, sid)
		for _, stackService := range stack.Services {
			if stopped[stackService.Service] == 1 {
				continue
			}

			glog.V(4).Infof("Stopping stack service %s\n", stackService.Service)
			numDeps := 0
			stoppedDeps := 0
			for _, ss := range stack.Services {
				svc, _ := s.etcd.GetServiceSpec(ss.Service)
				for _, dep := range svc.Dependencies {
					if dep.DependencyKey == stackService.Service {
						numDeps++
						if ss.Status == "stopped" || ss.Status == "" {
							stoppedDeps++
						}
					}
				}
			}
			if numDeps == 0 || stoppedDeps == numDeps {
				stopped[stackService.Service] = 1
				name := fmt.Sprintf("%s-%s", stack.Id, stackService.Service)
				glog.V(4).Infof("Stopping service %s\n", name)

				spec, _ := s.etcd.GetServiceSpec(stackService.Service)
				if len(spec.Ports) > 0 {
					err := s.kube.StopService(pid, name)
					// Log and continue
					if err != nil {
						glog.Error(err)
					}
				}

				glog.V(4).Infof("Stopping controller %s\n", name)
				err := s.kube.StopController(pid, name)
				if err != nil {
					glog.Error(err)
				}
			}
		}
		time.Sleep(time.Second * 3)
	}

	podStatus := make(map[string]string)
	pods, _ := s.kube.GetPods(pid, "stack", stack.Id)
	for _, pod := range pods {
		label := pod.Labels["service"]
		glog.V(4).Infof("Pod %s %d\n", label, len(pod.Status.Conditions))
		if len(pod.Status.Conditions) > 0 {
			podStatus[label] = string(pod.Status.Phase)
		}
	}
	for i := range stack.Services {
		stackService := &stack.Services[i]
		stackService.Status = podStatus[stackService.Service]
		stackService.Endpoints = nil
	}

	stack.Status = stackStatus[Stopped]
	s.etcd.PutStack(pid, sid, stack)

	stack, _ = s.getStackWithStatus(pid, sid)
	return stack, nil
}

func (s *Server) GetAllVolumes(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	volumes, err := s.etcd.GetVolumes(pid)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteJson(&volumes)
}

func (s *Server) PostVolume(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")

	vol := api.Volume{}
	err := r.DecodeJsonPayload(&vol)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if s.volumeExists(pid, vol.Name) {
		w.WriteHeader(http.StatusConflict)
		return
	}

	if vol.Attached != "" {
		if s.getStackService(pid, vol.Attached) == nil {
			rest.NotFound(w, r)
			return
		} else if s.attachmentExists(pid, vol.Attached) {
			w.WriteHeader(http.StatusConflict)
			return
		} else {
			vol.Status = "attached"
		}
	} else {
		vol.Status = "available"
	}

	glog.V(4).Infoln("Creating local volume")
	uid, err := newUUID()
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	vol.Id = uid

	err = os.Mkdir(s.volDir+"/"+uid, 0755)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	vol.Format = "hostPath"

	err = s.etcd.PutVolume(pid, vol.Id, vol)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteJson(&vol)
}

func (s *Server) PutVolume(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	vid := r.PathParam("vid")

	vol := api.Volume{}
	err := r.DecodeJsonPayload(&vol)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if vol.Attached != "" {
		// Don't allow attaching to a service with an existing volume
		if s.getStackService(pid, vol.Attached) == nil {
			rest.NotFound(w, r)
			return
		} else if s.attachmentExists(pid, vol.Attached) {
			w.WriteHeader(http.StatusConflict)
			return
		} else if !s.isStackStopped(pid, vol.Attached) {
			glog.V(4).Infof("Can't attach to a running stack\n")
			w.WriteHeader(http.StatusConflict)
			return
		} else {
			vol.Status = "attached"
		}
	} else {
		existingVol, err := s.etcd.GetVolume(pid, vid)
		if err != nil {
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if existingVol != nil && existingVol.Attached != "" {
			if !s.isStackStopped(pid, existingVol.Attached) {
				glog.V(4).Infof("Can't detach from a running stack\n")
				w.WriteHeader(http.StatusConflict)
				return
			} else {
				vol.Status = "available"
			}
		} else {
			glog.V(4).Infof("Volume already detached\n")
			w.WriteHeader(http.StatusConflict)
		}
	}

	err = s.etcd.PutVolume(pid, vid, vol)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteJson(&vol)
}

func (s *Server) GetVolume(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	vid := r.PathParam("vid")

	volume, err := s.etcd.GetVolume(pid, vid)
	if volume == nil {
		rest.NotFound(w, r)
	} else if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
	} else {
		w.WriteJson(&volume)
	}
}

func (s *Server) DeleteVolume(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	vid := r.PathParam("vid")

	glog.V(4).Infof("Deleting volume %s\n", vid)
	volume, err := s.etcd.GetVolume(pid, vid)

	if volume == nil {
		glog.V(4).Infoln("No such volume")
		if err != nil {
			glog.Error(err)
		}
		rest.NotFound(w, r)
		return
	} else if volume.Attached != "" && !s.isStackStopped(pid, volume.Attached) {
		glog.V(4).Infof("Can't attach to a running stack\n")
		w.WriteHeader(http.StatusConflict)
		return
	}

	glog.V(4).Infof("Format %s\n", volume.Format)
	if volume.Format == "hostPath" {
		err = os.RemoveAll(s.volDir + "/" + volume.Id)
		if err != nil {
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	err = s.etcd.DeleteVolume(pid, vid)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// newUUID generates a random UUID according to RFC 4122
func newUUID() (string, error) {
	uuid := make([]byte, 16)
	n, err := io.ReadFull(rand.Reader, uuid)
	if n != len(uuid) || err != nil {
		return "", err
	}
	// variant bits; see section 4.1.1
	uuid[8] = uuid[8]&^0xc0 | 0x80
	// version 4 (pseudo-random); see section 4.1.3
	uuid[6] = uuid[6]&^0xf0 | 0x40
	return fmt.Sprintf("%x-%x-%x-%x-%x", uuid[0:4], uuid[4:6], uuid[6:8], uuid[8:10], uuid[10:]), nil
}

func (s *Server) GetLogs(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	ssid := r.PathParam("ssid")
	lines := r.Request.FormValue("lines")

	if !s.stackServiceExists(pid, ssid) {
		rest.Error(w, "No such service", http.StatusNotFound)
		return
	}

	tailLines, err := strconv.Atoi(lines)

	sid := ssid[0:strings.LastIndex(ssid, "-")]
	logs, err := s.getLogs(pid, sid, ssid, tailLines)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	} else {
		w.WriteJson(&logs)
	}
}

func (s *Server) GetConfigs(w rest.ResponseWriter, r *rest.Request) {
	services := r.Request.FormValue("services")

	sids := strings.Split(services, ",")

	configs := make(map[string][]api.Config)
	for _, sid := range sids {
		if !s.serviceExists(sid) {
			rest.Error(w, "No such service", http.StatusNotFound)
			return
		}
		spec, err := s.etcd.GetServiceSpec(sid)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		} else {
			configs[sid] = spec.Config
		}
	}
	w.WriteJson(&configs)
}

func (s *Server) getLogs(pid string, sid string, ssid string, tailLines int) (string, error) {

	glog.V(4).Infof("Getting logs for %s %s %d", sid, ssid, tailLines)

	stack, err := s.etcd.GetStack(pid, sid)
	if err != nil {
		return "", err
	}

	pods, err := s.kube.GetPods(pid, "stack", stack.Id)
	if err != nil {
		return "", err
	}

	for _, ss := range stack.Services {
		if ss.Id == ssid {
			// Find the pod for this service
			for _, pod := range pods {
				if pod.Labels["name"] == ssid {
					log, err := s.kube.GetLog(pid, pod.Name, tailLines)
					if err != nil {
						return "", err
					} else {
						return log, nil
					}
				}
			}
		}
	}
	return "", nil
}

func (s *Server) addServiceFile(path string) error {
	if path[len(path)-4:len(path)] != "json" {
		return nil
	}
	glog.V(4).Infof("Adding %s", path)
	service := api.ServiceSpec{}
	data, err := ioutil.ReadFile(path)
	if err != nil {
		fmt.Println(err)
		return err
	}
	err = json.Unmarshal(data, &service)
	if err != nil {
		fmt.Println(err)
		return err
	}
	s.etcd.PutService(service.Key, &service)
	return nil
}

func (s *Server) loadSpecs(path string) error {
	files, err := ioutil.ReadDir(path)
	if err != nil {
		return err
	}

	for _, file := range files {
		if file.IsDir() {
			s.loadSpecs(fmt.Sprintf("%s/%s", path, file.Name()))
		} else {
			s.addServiceFile(fmt.Sprintf("%s/%s", path, file.Name()))
		}
	}
	return nil
}
