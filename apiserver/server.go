package main

import (
	"crypto/rand"
	"encoding/json"
	"flag"
	"fmt"
	"github.com/StephanDollberg/go-json-rest-middleware-jwt"
	"github.com/ant0ine/go-json-rest/rest"
	"github.com/coreos/etcd/client"
	"github.com/golang/glog"
	kube "github.com/nds-labs/apiserver/kube"
	openstack "github.com/nds-labs/apiserver/openstack"
	api "github.com/nds-labs/apiserver/types"
	"golang.org/x/net/context"
	gcfg "gopkg.in/gcfg.v1"
	"io"
	"io/ioutil"
	k8api "k8s.io/kubernetes/pkg/api"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

var etcdBasePath = "/ndslabs/"

type StackStatus struct {
	Code    int
	Message string
}

var stackStatus = map[int]string{
	Started:  "started",
	Starting: "starting",
	Stopped:  "stopped",
	Stopping: "stopping",
}

type Error struct {
	ErrorCode int    `json:"errorCode"`
	Message   string `json:"message"`
}

var errors = map[int]string{
	NotFound: "Not found",
	Exists:   "Exists",
}

const (
	NotFound = 100
	Exists   = 101
	Started  = 1
	Starting = 2
	Stopped  = 3
	Stopping = 4
)

func NewError(errorCode int) *Error {
	return &Error{
		ErrorCode: errorCode,
		Message:   errors[errorCode],
	}
}

func (e Error) Error() string {
	return e.Message
}

type Config struct {
	Server struct {
		Port         string
		Origin       string
		VolDir       string
		JwtKey       string
		Host         string
		VolumeSource string
	}
	Etcd struct {
		Address string
	}
	Kubernetes struct {
		Address string
	}
	OpenStack struct {
		IdentityEndpoint string
		ComputeEndpoint  string
		VolumesEndpoint  string
		TenantId         string
		Username         string
		Password         string
	}
}

func main() {

	var confPath string
	flag.StringVar(&confPath, "conf", "apiserver.conf", "Configuration path")
	flag.Parse()
	cfg := Config{}
	err := gcfg.ReadFileInto(&cfg, confPath)
	if err != nil {
		glog.Error(err)
		os.Exit(-1)
	}

	if cfg.Server.Port == "" {
		cfg.Server.Port = "8083"
	}
	if cfg.Server.JwtKey == "" {
		cfg.Server.JwtKey = "jwt.pem"
	}
	if cfg.Server.Host == "" {
		cfg.Server.Host = "localhost"
	}
	if cfg.Etcd.Address == "" {
		cfg.Etcd.Address = "localhost:4001"
	}
	if cfg.Kubernetes.Address == "" {
		cfg.Kubernetes.Address = "localhost:4001"
	}

	glog.Info("Starting NDS Labs API server")
	glog.Infof("etcd %s ", cfg.Etcd.Address)
	glog.Infof("kube-apiserver %s", cfg.Kubernetes.Address)
	glog.Infof("volume dir %s", cfg.Server.VolDir)
	glog.Infof("JWT key %s ", cfg.Server.JwtKey)
	glog.Infof("host %s ", cfg.Server.Host)
	glog.Infof("port %s", cfg.Server.Port)
	glog.V(1).Infoln("V1")
	glog.V(2).Infoln("V2")
	glog.V(3).Infoln("V3")
	glog.V(4).Infoln("V4")

	oshelper := openstack.OpenStack{}
	oshelper.IdentityEndpoint = cfg.OpenStack.IdentityEndpoint
	oshelper.VolumesEndpoint = cfg.OpenStack.VolumesEndpoint
	oshelper.ComputeEndpoint = cfg.OpenStack.ComputeEndpoint
	oshelper.Username = cfg.OpenStack.Username
	oshelper.Password = cfg.OpenStack.Password
	oshelper.TenantId = cfg.OpenStack.TenantId

	kube := kube.NewKubeHelper(cfg.Kubernetes.Address)

	storage := Storage{}
	etcd, err := GetEtcdClient(cfg.Etcd.Address)
	if err != nil {
		glog.Fatal(err)
	}
	storage.etcd = etcd
	storage.kube = kube
	if cfg.Server.VolumeSource == "openstack" {
		storage.local = false
		storage.os = oshelper
		glog.Infoln("Using OpenStack storage")
	} else {
		storage.local = true
		storage.volDir = cfg.Server.VolDir
		glog.Infoln("Using local storage")
	}

	jwtKey, err := ioutil.ReadFile(cfg.Server.JwtKey)
	if err != nil {
		glog.Fatal(err)
	}

	storage.jwtKey = jwtKey
	storage.host = cfg.Server.Host

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

	jwt := &jwt.JWTMiddleware{
		Key:        jwtKey,
		Realm:      "ndslabs",
		Timeout:    time.Minute * 30,
		MaxRefresh: time.Hour * 24,
		Authenticator: func(userId string, password string) bool {
			if userId == "admin" && password == "12345" {
				return true
			} else {
				project, err := storage.getProject(userId)
				if err != nil {
					glog.Error(err)
					return false
				} else {
					return project.Namespace == userId && project.Password == password
				}
			}
		},
	}

	api.Use(&rest.IfMiddleware{
		Condition: func(request *rest.Request) bool {
			return request.URL.Path != "/authenticate"
		},
		IfTrue: jwt,
	})

	/*
		api.Use(&rest.AuthBasicMiddleware{
			Realm: "ndslabs",
			Authenticator: func(userId string, password string) bool {
				if userId == "demo" && password == "12345" {
					log.Printf("%s = %s", userId, password)
					storage.Namespace = userId
					return true
				}
				return false
			},
		})
	*/

	router, err := rest.MakeRouter(
		rest.Get("/", GetPaths),
		rest.Post("/authenticate", jwt.LoginHandler),
		rest.Delete("/authenticate", storage.Logout),
		rest.Get("/refresh_token", jwt.RefreshHandler),
		rest.Get("/projects", storage.GetAllProjects),
		rest.Put("/projects/:pid", storage.PutProject),
		rest.Get("/projects/:pid", storage.GetProject),
		rest.Delete("/projects/:pid", storage.DeleteProject),
		rest.Get("/services", storage.GetAllServices),
		rest.Post("/services", storage.PostService),
		rest.Put("/services/:key", storage.PutService),
		rest.Get("/services/:key", storage.GetService),
		rest.Delete("/services/:key", storage.DeleteService),
		rest.Get("/projects/:pid/stacks", storage.GetAllStacks),
		rest.Post("/projects/:pid/stacks", storage.PostStack),
		rest.Put("/projects/:pid/stacks/:sid", storage.PutStack),
		rest.Get("/projects/:pid/stacks/:sid", storage.GetStack),
		rest.Delete("/projects/:pid/stacks/:sid", storage.DeleteStack),
		rest.Get("/projects/:pid/volumes", storage.GetAllVolumes),
		rest.Post("/projects/:pid/volumes", storage.PostVolume),
		rest.Put("/projects/:pid/volumes/:vid", storage.PutVolume),
		rest.Get("/projects/:pid/volumes/:vid", storage.GetVolume),
		rest.Delete("/projects/:pid/volumes/:vid", storage.DeleteVolume),
		rest.Get("/projects/:pid/start/:sid", storage.StartStack),
		rest.Get("/projects/:pid/stop/:sid", storage.StopStack),
		rest.Get("/projects/:pid/logs/:ssid", storage.GetLogs),
	)

	if err != nil {
		glog.Fatal(err)
	}
	api.SetApp(router)

	glog.Infof("Listening on %s:%s", cfg.Server.Host, cfg.Server.Port)
	glog.Fatal(http.ListenAndServe(":"+cfg.Server.Port, api.MakeHandler()))
}

type Storage struct {
	etcd      client.KeysAPI
	kube      *kube.KubeHelper
	Namespace string
	os        openstack.OpenStack
	local     bool
	volDir    string
	host      string
	jwtKey    []byte
}

func GetPaths(w rest.ResponseWriter, r *rest.Request) {
	paths := []string{}
	paths = append(paths, "/authenticate")
	paths = append(paths, "/projects")
	paths = append(paths, "/services")
	w.WriteJson(&paths)
}

func (s *Storage) Logout(w rest.ResponseWriter, r *rest.Request) {
	w.WriteHeader(http.StatusOK)
}

func (s *Storage) GetAllProjects(w rest.ResponseWriter, r *rest.Request) {

	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/projects", nil)
	if err != nil {
		if e, ok := err.(client.Error); ok {
			if e.Code == client.ErrorCodeKeyNotFound {
				rest.NotFound(w, r)
			} else {
				glog.Error(err)
				rest.Error(w, e.Error(), http.StatusInternalServerError)
			}
		} else {
			glog.Error(err)
		}
	} else {
		projects := []api.Project{}
		nodes := resp.Node.Nodes
		for _, node := range nodes {
			project := api.Project{}
			json.Unmarshal([]byte(node.Value), &project)
			projects = append(projects, project)
		}
		w.WriteJson(&projects)
	}
}

func (s *Storage) GetProject(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")

	project, err := s.getProject(pid)
	if err != nil {
		rest.NotFound(w, r)
	} else {
		w.WriteJson(project)
	}
}

func (s *Storage) getProject(pid string) (*api.Project, error) {
	path := etcdBasePath + "/projects/" + pid + "/project"

	glog.Infof("getProject %s\n", path)

	resp, err := s.etcd.Get(context.Background(), path, nil)

	if err != nil {
		return nil, err
	} else {
		project := api.Project{}
		json.Unmarshal([]byte(resp.Node.Value), &project)
		return &project, nil
	}
}

func (s *Storage) PutProject(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")

	project := api.Project{}
	err := r.DecodeJsonPayload(&project)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data, err := json.Marshal(project)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	opts := client.SetOptions{Dir: true}
	s.etcd.Set(context.Background(), etcdBasePath+"/projects/", pid, &opts)
	_, err = s.etcd.Set(context.Background(), etcdBasePath+"/projects/"+pid+"/project", string(data), nil)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = s.kube.CreateNamespace(pid)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
	} else {
		w.WriteHeader(http.StatusCreated)
	}
}

func (s *Storage) DeleteProject(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")

	glog.V(4).Infof("DeleteProject %s", pid)

	_, err := s.etcd.Delete(context.Background(), etcdBasePath+"/projects/"+pid, nil)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (s *Storage) GetAllServices(w rest.ResponseWriter, r *rest.Request) {

	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/services", nil)
	if err != nil {
		if e, ok := err.(client.Error); ok {
			if e.Code == client.ErrorCodeKeyNotFound {
				services := []api.ServiceSpec{}
				w.WriteJson(&services)
			} else {
				glog.Error(err)
				rest.Error(w, e.Error(), http.StatusInternalServerError)
			}
		} else {
			glog.Error(err)
		}
		w.WriteJson(&err)
	} else {
		services := []api.ServiceSpec{}
		nodes := resp.Node.Nodes
		for _, node := range nodes {
			service := api.ServiceSpec{}
			json.Unmarshal([]byte(node.Value), &service)
			services = append(services, service)
		}
		w.WriteJson(&services)
	}
}

func (s *Storage) GetService(w rest.ResponseWriter, r *rest.Request) {
	key := r.PathParam("key")
	glog.V(4).Infof("GetService %s\n", key)

	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/services/"+key, nil)

	if err != nil {
		if e, ok := err.(client.Error); ok {
			if e.Code == client.ErrorCodeKeyNotFound {
				rest.NotFound(w, r)
			} else {
				rest.Error(w, e.Error(), http.StatusInternalServerError)
			}
		}
		w.WriteJson(&err)
	} else {
		glog.V(4).Infof("Node.Value %s\n", resp.Node.Value)
		service := api.ServiceSpec{}
		json.Unmarshal([]byte(resp.Node.Value), &service)
		w.WriteJson(&service)
	}
}

func (s *Storage) PostService(w rest.ResponseWriter, r *rest.Request) {

	service := api.ServiceSpec{}
	err := r.DecodeJsonPayload(&service)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data, _ := json.Marshal(service)
	resp, err := s.etcd.Set(context.Background(), etcdBasePath+"/services/"+service.Key, string(data), nil)
	w.WriteJson(&resp)
}

func (s *Storage) PutService(w rest.ResponseWriter, r *rest.Request) {
	key := r.PathParam("key")

	service := api.ServiceSpec{}
	err := r.DecodeJsonPayload(&service)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data, _ := json.Marshal(service)
	resp, err := s.etcd.Set(context.Background(), etcdBasePath+"/services/"+key, string(data), nil)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteJson(&resp)
}

func (s *Storage) DeleteService(w rest.ResponseWriter, r *rest.Request) {
	key := r.PathParam("key")

	_, err := s.etcd.Delete(context.Background(), etcdBasePath+"/services/"+key, nil)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func GetEtcdClient(etcdAddress string) (client.KeysAPI, error) {
	glog.V(3).Infof("GetEtcdClient %s\n", etcdAddress)

	cfg := client.Config{
		Endpoints:               []string{"http://" + etcdAddress},
		Transport:               client.DefaultTransport,
		HeaderTimeoutPerRequest: time.Second,
	}

	c, err := client.New(cfg)
	if err != nil {
		glog.Error(err)
		return nil, err
	}
	kapi := client.NewKeysAPI(c)

	resp, err := kapi.Get(context.Background(), "/", nil)
	_ = resp
	if err != nil {
		glog.Error(err)
		return nil, err
	}

	return kapi, nil
}

func (s *Storage) getServiceSpec(key string) (*api.ServiceSpec, error) {

	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/services/"+key, nil)
	if err != nil {
		glog.Error(err)
		return nil, err
	} else {
		service := api.ServiceSpec{}
		node := resp.Node
		json.Unmarshal([]byte(node.Value), &service)
		return &service, nil
	}
}

func (s *Storage) GetAllStacks(w rest.ResponseWriter, r *rest.Request) {
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

func (s *Storage) getStacks(pid string) (*[]api.Stack, error) {

	stacks := []api.Stack{}

	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/projects/"+pid+"/stacks", nil)

	if err == nil {
		nodes := resp.Node.Nodes
		for _, node := range nodes {
			stack := api.Stack{}

			json.Unmarshal([]byte(node.Value), &stack)

			// Get the pods for this stack
			podStatus := make(map[string]string)
			glog.V(4).Infof("Pods for %s\n", stack.Id)
			pods, _ := s.kube.GetPods(pid, "stack", stack.Id)
			for _, pod := range pods {
				label := pod.Labels["name"]
				if len(pod.Status.Conditions) > 0 {
					glog.V(4).Infof("Pod %s %s\n", label, string(pod.Status.Phase))
					podStatus[label] = string(pod.Status.Phase)
				}
			}

			k8services, _ := s.kube.GetServices(pid, stack.Id)
			endpoints := make(map[string]string)
			for _, k8service := range k8services {
				glog.V(4).Infof("Service : %s %s\n", k8service.Name, k8service.Spec.Type)
				if k8service.Spec.Type == "NodePort" {
					glog.V(4).Infof("NodePort : %s %d\n", k8service.Name, k8service.Spec.Ports[0].NodePort)
					endpoints[k8service.Name] = fmt.Sprintf("http://%s:%d", s.host, k8service.Spec.Ports[0].NodePort)
				}
			}

			for i := range stack.Services {
				stackService := &stack.Services[i]
				glog.V(4).Infof("Stack Service %s %s\n", stackService.Id, podStatus[stackService.Id])
				stackService.Status = podStatus[stackService.Id]
				if len(endpoints[stackService.Id]) > 0 {
					glog.V(4).Infof("Endpoint %s %s\n", stackService.Id, endpoints[stackService.Id])
					stackService.Endpoints = append(stackService.Endpoints, endpoints[stackService.Id])
				}
			}
			stacks = append(stacks, stack)
		}
		//data, _ := json.MarshalIndent(stacks, "", "    ")
		//fmt.Println(string(data))
	}
	return &stacks, nil
}

func (s *Storage) isStackStopped(pid string, ssid string) bool {
	sid := ssid[0:strings.LastIndex(ssid, "-")]
	stack, _ := s.getStack(pid, sid)

	if stack.Status == stackStatus[Stopped] {
		return true
	} else {
		return false
	}
}

func (s *Storage) getStackService(pid string, ssid string) *api.StackService {
	sid := ssid[0:strings.LastIndex(ssid, "-")]
	stack, _ := s.getStack(pid, sid)
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

func (s *Storage) attachmentExists(pid string, ssid string) bool {
	volumes, _ := s.getVolumes(pid)
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

func (s *Storage) volumeExists(pid string, name string) bool {
	volumes, _ := s.getVolumes(pid)
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

func (s *Storage) stackExists(pid string, name string) bool {
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

func (s *Storage) getStack(pid string, sid string) (*api.Stack, error) {

	path := "/projects/" + pid + "/stacks/" + sid
	resp, err := s.etcd.Get(context.Background(), etcdBasePath+path, nil)

	if err != nil {
		return nil, err
	} else {
		stack := api.Stack{}
		json.Unmarshal([]byte(resp.Node.Value), &stack)
		return &stack, nil
	}
}

func (s *Storage) GetStack(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	sid := r.PathParam("sid")

	stack, err := s.getStack(pid, sid)
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

func (s *Storage) PostStack(w rest.ResponseWriter, r *rest.Request) {
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

	_, err = s.getServiceSpec(stack.Key)
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

	opts := client.SetOptions{Dir: true}
	s.etcd.Set(context.Background(), etcdBasePath+"/projects/"+pid, "/stacks", &opts)

	data, _ := json.Marshal(stack)
	path := etcdBasePath + "/projects/" + pid + "/stacks/" + stack.Id
	_, err = s.etcd.Set(context.Background(), path, string(data), nil)
	w.WriteJson(&stack)
}

func (s *Storage) putStack(pid string, sid string, stack *api.Stack) error {
	opts := client.SetOptions{Dir: true}
	s.etcd.Set(context.Background(), etcdBasePath+"/projects/"+pid, "/stacks", &opts)

	data, _ := json.Marshal(stack)
	path := etcdBasePath + "/projects/" + pid + "/stacks/" + sid
	//glog.V(4).Infof("stack %s\n", data)
	_, err := s.etcd.Set(context.Background(), path, string(data), nil)
	if err != nil {
		glog.Error("Error storing stack %s", err)
		return err
	} else {
		return nil
	}
}

func (s *Storage) PutStack(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	sid := r.PathParam("sid")

	stack := api.Stack{}
	err := r.DecodeJsonPayload(stack)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	stack.Status = stackStatus[Stopped]
	err = s.putStack(pid, sid, &stack)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteJson(&stack)
}

func (s *Storage) DeleteStack(w rest.ResponseWriter, r *rest.Request) {

	pid := r.PathParam("pid")
	sid := r.PathParam("sid")

	stack, err := s.getStack(pid, sid)
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

	path := etcdBasePath + "/projects/" + pid + "/stacks/" + sid
	_, err = s.etcd.Delete(context.Background(), path, nil)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	volumes, err := s.getVolumes(pid)
	for _, volume := range *volumes {
		for _, ss := range stack.Services {
			if volume.Attached == ss.Id {
				glog.V(4).Infof("Detaching volume %s\n", volume.Id)
				volume.Attached = ""
				volume.Status = "available"
				s.putVolume(pid, volume.Name, volume)
				// detach the volume
			}
		}
	}

	w.WriteHeader(http.StatusOK)
}

func (s *Storage) getVolumes(pid string) (*[]api.Volume, error) {

	volumes := make([]api.Volume, 0)

	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/projects/"+pid+"/volumes", nil)
	if err != nil {
		return &volumes, err
	} else {
		nodes := resp.Node.Nodes
		for _, node := range nodes {
			volume := api.Volume{}
			json.Unmarshal([]byte(node.Value), &volume)

			volumes = append(volumes, volume)
		}
	}

	return &volumes, nil
}

func (s *Storage) startStackService(serviceKey string, pid string, stack *api.Stack, addrPortMap *map[string]kube.ServiceAddrPort) {

	service, _ := s.getServiceSpec(serviceKey)
	for _, dep := range service.Dependencies {
		if dep.Required {
			glog.V(4).Infof("Starting required dependency %s\n", dep.DependencyKey)
			s.startController(pid, dep.DependencyKey, stack, addrPortMap)
		} else {
			s.startStackService(dep.DependencyKey, pid, stack, addrPortMap)
		}
	}
}

func (s *Storage) startController(pid string, serviceKey string, stack *api.Stack, addrPortMap *map[string]kube.ServiceAddrPort) (bool, error) {

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
	service, _ := s.getServiceSpec(serviceKey)

	name := fmt.Sprintf("%s-%s", stack.Id, service.Key)
	template := s.kube.CreateControllerTemplate(name, stack.Id, service, addrPortMap)

	if service.RequiresVolume {
		k8vols := make([]k8api.Volume, 0)
		k8vol := k8api.Volume{}
		k8vol.Name = stackService.Service
		glog.V(4).Infof("Need volume for %s \n", stackService.Service)

		volumes, _ := s.getVolumes(pid)
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
	time.Sleep(time.Second * 5)

	// Wait for pods in ready state
	ready := 0
	name = fmt.Sprintf("%s-%s", stack.Id, serviceKey)
	pods, _ = s.kube.GetPods(pid, "name", name)
	glog.V(4).Infof("Waiting for pod to be ready %s %d\n", name, len(pods))
	for ready < len(pods) {
		for _, pod := range pods {
			if len(pod.Status.Conditions) > 0 {
				condition := pod.Status.Conditions[0]
				phase := pod.Status.Phase
				containerState := ""
				if len(pod.Status.ContainerStatuses) > 0 {
					state := pod.Status.ContainerStatuses[0].State
					switch {
					case state.Running != nil:
						containerState = "running"
					case state.Waiting != nil:
						containerState = "waiting"
					case state.Terminated != nil:
						containerState = "terminated"
					}
				}

				glog.V(4).Infof("Waiting for %s (%s=%s) [%s, %#v]\n", pod.Name, condition.Type, condition.Status, phase, containerState)
				stackService.Status = string(pod.Status.Phase)

				if condition.Type == "Ready" && condition.Status == "True" {
					ready++
				} else {
					pods, _ = s.kube.GetPods(pid, "name", name)
					time.Sleep(time.Second * 5)
				}
			}
		}
	}
	return true, nil
}

func (s *Storage) StartStack(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	sid := r.PathParam("sid")

	stack, _ := s.getStack(pid, sid)
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

	stack.Status = stackStatus[Starting]
	s.putStack(pid, sid, stack)

	stackServices := stack.Services

	// Start all Kubernetes services
	addrPortMap := make(map[string]kube.ServiceAddrPort)
	for _, stackService := range stackServices {
		spec, _ := s.getServiceSpec(stackService.Service)
		if spec.IsService {
			name := fmt.Sprintf("%s-%s", stack.Id, spec.Key)

			template := s.kube.CreateServiceTemplate(name, stack.Id, spec)

			glog.V(4).Infof("Starting Kubernetes service %s\n", name)
			svc, err := s.kube.StartService(pid, template)

			if err != nil {
				fmt.Println("Error starting service")
			} else {
				fmt.Printf("Started service %s\n", name)
				addrPort := kube.ServiceAddrPort{
					Name: stackService.Service,
					Host: svc.Spec.ClusterIP,
					Port: svc.Spec.Ports[0].Port,
				}
				addrPortMap[stackService.Service] = addrPort
			}
		}
	}

	// Start required depedencies
	s.startStackService(stack.Key, pid, stack, &addrPortMap)

	// Start optional dependencies
	for _, stackService := range stack.Services {
		s.startController(pid, stackService.Service, stack, &addrPortMap)
	}

	// TODO: Get Stack Status
	stack.Status = "started"
	s.putStack(pid, sid, stack)

	stack, _ = s.getStackWithStatus(pid, sid)
	w.WriteJson(&stack)
}

func (s *Storage) getStackWithStatus(pid string, sid string) (*api.Stack, error) {

	stack, _ := s.getStack(pid, sid)
	// Get the pods for this stack
	podStatus := make(map[string]string)

	pods, _ := s.kube.GetPods(pid, "stack", sid)
	//pods, _ := s.getPods(pid, "stack", stack.Key)
	for _, pod := range pods {
		label := pod.Labels["name"]
		glog.V(4).Infof("Pod %s %d\n", label, len(pod.Status.Conditions))
		if len(pod.Status.Conditions) > 0 {
			podStatus[label] = string(pod.Status.Phase)
		}
	}

	k8services, _ := s.kube.GetServices(pid, sid)
	endpoints := make(map[string]string)
	for _, k8service := range k8services {
		glog.V(4).Infof("Service : %s %s\n", k8service.Name, k8service.Spec.Type)
		if k8service.Spec.Type == "NodePort" {
			endpoints[k8service.GetName()] = fmt.Sprintf("http://%s:%d", s.host, k8service.Spec.Ports[0].NodePort)
		}
	}

	for i := range stack.Services {
		stackService := &stack.Services[i]
		glog.V(4).Infof("Stack Service %s %s\n", stackService.Service, podStatus[stackService.Service])
		stackService.Status = podStatus[stackService.Service]
		if len(endpoints[stackService.Service]) > 0 {
			stackService.Endpoints = append(stackService.Endpoints, endpoints[stackService.Service])
		}
	}

	return stack, nil
}

func (s *Storage) StopStack(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	sid := r.PathParam("sid")

	stack, err := s.getStack(pid, sid)
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
		//w.WriteHeader(http.StatusOK)
		w.WriteJson(&stack)
	} else {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
	}

}

func (s *Storage) stopStack(pid string, sid string) (*api.Stack, error) {

	path := "/projects/" + pid + "/stacks/" + sid
	glog.V(4).Infof("Stopping stack %s\n", path)

	stack, _ := s.getStack(pid, sid)

	glog.V(4).Infof("Stack status %s\n", stack.Status)
	if stack.Status == stackStatus[Stopping] || stack.Status == stackStatus[Stopped] {
		// Can't stop a stopped service
		glog.V(4).Infof("Can't stop a stopped service")
		return stack, nil
	}

	stack.Status = stackStatus[Stopping]
	s.putStack(pid, sid, stack)

	stackServices := stack.Services

	for _, stackService := range stackServices {

		name := fmt.Sprintf("%s-%s", stack.Id, stackService.Service)
		glog.V(4).Infof("Stopping service %s\n", name)
		spec, _ := s.getServiceSpec(stackService.Service)
		if spec.IsService {
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

	time.Sleep(time.Second * 10)

	pods, _ := s.kube.GetPods(pid, "name", stack.Id)
	glog.V(4).Infof("Waiting for pod to stop %s %d\n", stack.Id, len(pods))
	for len(pods) > 0 {
		for _, pod := range pods {
			if len(pod.Status.Conditions) > 0 {
				condition := pod.Status.Conditions[0]
				phase := pod.Status.Phase
				containerState := ""
				if len(pod.Status.ContainerStatuses) > 0 {
					state := pod.Status.ContainerStatuses[0].State
					switch {
					case state.Running != nil:
						containerState = "running"
					case state.Waiting != nil:
						containerState = "waiting"
					case state.Terminated != nil:
						containerState = "terminated"
					}
				}

				glog.V(4).Infof("Waiting for %s (%s=%s) [%s, %s]\n", pod.Name, condition.Type, condition.Status, phase, containerState)
			}
		}
		pods, _ = s.kube.GetPods(pid, "name", stack.Id)
		time.Sleep(time.Second * 5)
	}

	podStatus := make(map[string]string)
	pods, _ = s.kube.GetPods(pid, "stack", stack.Id)
	for _, pod := range pods {
		label := pod.Labels["name"]
		glog.V(4).Infof("Pod %s %d\n", label, len(pod.Status.Conditions))
		if len(pod.Status.Conditions) > 0 {
			podStatus[label] = string(pod.Status.Phase)
		}
	}
	for i := range stack.Services {
		stackService := &stack.Services[i]
		stackService.Status = podStatus[stackService.Service]
	}

	stack.Status = stackStatus[Stopped]
	s.putStack(pid, sid, stack)

	stack, _ = s.getStackWithStatus(pid, sid)
	return stack, nil
}

func (s *Storage) GetAllVolumes(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/projects/"+pid+"/volumes", nil)
	if err != nil {
		if e, ok := err.(client.Error); ok {
			if e.Code == client.ErrorCodeKeyNotFound {
				w.WriteJson(&[]api.Volume{})
				return
			} else {
				glog.Error(err)
				rest.Error(w, e.Error(), http.StatusInternalServerError)
			}
		} else {
			glog.Error(err)
		}
		w.WriteJson(&err)
		return
	}
	volumes := []api.Volume{}
	nodes := resp.Node.Nodes
	for _, node := range nodes {
		volume := api.Volume{}
		json.Unmarshal([]byte(node.Value), &volume)
		volumes = append(volumes, volume)
	}
	w.WriteJson(&volumes)
}

func (s *Storage) PostVolume(w rest.ResponseWriter, r *rest.Request) {
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

	if s.local {
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

	} else {
		// Create volume via OpenStack API
		glog.V(4).Infoln("Creating OpenStack volume")

		token, err := s.os.Authenticate(s.os.Username, s.os.Password,
			s.os.TenantId)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		instanceId, err := s.os.GetInstanceId()
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		osName := fmt.Sprintf("ndslabs-%s-%s\n", pid, vol.Name)
		volumeId, err := s.os.CreateVolume(token.Id, s.os.TenantId, osName, vol.Size)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		vol.Id = volumeId
		vol.Format = "cinder"

		var osVolume *openstack.Volume
		for true {
			osVolume, err = s.os.GetVolume(token.Id, s.os.TenantId, volumeId)
			if err != nil {
				glog.Error(err)
				rest.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			if osVolume.Status == "available" {
				break
			}
		}

		err = s.os.AttachVolume(token.Id, s.os.TenantId, instanceId, volumeId)
		if err != nil {
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		for true {
			osVolume, err = s.os.GetVolume(token.Id, s.os.TenantId, volumeId)
			if err != nil {
				rest.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			if osVolume.Status == "in-use" {
				break
			}
		}
		//time.Sleep(time.Second*2)

		err = s.os.Mkfs(osVolume.Device, "xfs")
		if err != nil {
			glog.Error(err)
			return
		}

		err = s.os.DetachVolume(token.Id, s.os.TenantId, instanceId, volumeId)
		if err != nil {
			glog.Error(err)
			return
		}

		vol.Format = "cinder"
	}

	opts := client.SetOptions{Dir: true}
	s.etcd.Set(context.Background(), etcdBasePath+"/projects/"+pid, "/volumes", &opts)
	data, _ := json.Marshal(vol)
	path := etcdBasePath + "/projects/" + pid + "/volumes/" + vol.Name
	_, err = s.etcd.Set(context.Background(), path, string(data), nil)
	w.WriteJson(&vol)
}

func (s *Storage) putVolume(pid string, name string, volume api.Volume) error {
	opts := client.SetOptions{Dir: true}
	s.etcd.Set(context.Background(), etcdBasePath+"/projects/"+pid, "/volumes", &opts)

	data, _ := json.Marshal(volume)
	path := etcdBasePath + "/projects/" + pid + "/volumes/" + name
	_, err := s.etcd.Set(context.Background(), path, string(data), nil)
	if err != nil {
		return err
	} else {
		return nil
	}
}

func (s *Storage) PutVolume(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	vid := r.PathParam("vid")

	vol := api.Volume{}
	err := r.DecodeJsonPayload(&vol)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Don't allow attaching to a service with an existing volume
	if vol.Attached != "" {
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
		vol.Status = "available"
	}

	err = s.putVolume(pid, vid, vol)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteJson(&vol)
}

func (s *Storage) getVolume(pid string, vid string) (*api.Volume, error) {
	path := etcdBasePath + "/projects/" + pid + "/volumes/" + vid
	resp, err := s.etcd.Get(context.Background(), path, nil)

	if err != nil {
		return nil, err
	} else {
		volume := api.Volume{}
		json.Unmarshal([]byte(resp.Node.Value), &volume)
		return &volume, nil
	}
}

func (s *Storage) GetVolume(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	vid := r.PathParam("vid")

	volume, err := s.getVolume(pid, vid)
	if volume == nil {
		rest.NotFound(w, r)
	} else if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
	} else {
		w.WriteJson(&volume)
	}
}

func (s *Storage) DeleteVolume(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	vid := r.PathParam("vid")

	glog.V(4).Infof("Deleting volume %s\n", vid)
	volume, err := s.getVolume(pid, vid)

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
	} else if volume.Format == "cinder" {
		token, err := s.os.Authenticate(s.os.Username, s.os.Password,
			s.os.TenantId)
		if err != nil {
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		err = s.os.DeleteVolume(token.Id, s.os.TenantId, volume.Id)
		if err != nil {
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	path := etcdBasePath + "/projects/" + pid + "/volumes/" + vid
	_, err = s.etcd.Delete(context.Background(), path, nil)
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

func (s *Storage) GetLogs(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	ssid := r.PathParam("ssid")
	lines := r.Request.FormValue("lines")

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

func (s *Storage) getLogs(pid string, sid string, ssid string, tailLines int) (string, error) {

	glog.V(4).Infof("Getting logs for %s %s %d", sid, ssid, tailLines)

	stack, err := s.getStack(pid, sid)
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
