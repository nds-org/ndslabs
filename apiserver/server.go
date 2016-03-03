package main

import (
	"bytes"
	"crypto/rand"
	"encoding/json"
	"flag"
	"fmt"
	"github.com/StephanDollberg/go-json-rest-middleware-jwt"
	"github.com/ant0ine/go-json-rest/rest"
	"github.com/coreos/etcd/client"
	etcderr "github.com/coreos/etcd/error"
	"github.com/golang/glog"
	openstack "github.com/nds-labs/apiserver/openstack"
	api "github.com/nds-labs/apiserver/types"
	"golang.org/x/net/context"
	gcfg "gopkg.in/gcfg.v1"
	"io"
	"io/ioutil"
	k8api "k8s.io/kubernetes/pkg/api"
	"net/http"
	"os"
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

	flag.Parse()
	cfg := Config{}
	err := gcfg.ReadFileInto(&cfg, "apiserver.conf")
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

	storage := Storage{}
	etcd, err := GetEtcdClient(cfg.Etcd.Address)
	if err != nil {
		glog.Fatal(err)
	}
	storage.etcd = etcd
	storage.kubeBase = "http://" + cfg.Kubernetes.Address //Todo: use Kube client
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
		rest.Put("/templates/:key/:type", storage.PutServiceTemplate),
		rest.Get("/templates/:key/:type", storage.GetServiceTemplate),
		//rest.Delete("/services/:id/template/:type", storage.DeleteServiceTemplate),
		rest.Get("/projects/:pid/stacks", storage.GetAllStacks),
		rest.Post("/projects/:pid/stacks", storage.PostStack),
		rest.Put("/projects/:pid/stacks/:sid", storage.PutStack),
		rest.Get("/projects/:pid/stacks/:sid", storage.GetStack),
		rest.Delete("/projects/:pid/stacks/:sid", storage.DeleteStack),
		rest.Get("/projects/:pid/volumes", storage.GetAllVolumes),
		rest.Post("/projects/:pid/volumes", storage.CreateVolume),
		rest.Put("/projects/:pid/volumes/:vid", storage.PutVolume),
		rest.Get("/projects/:pid/volumes/:vid", storage.GetVolume),
		rest.Delete("/projects/:pid/volumes/:vid", storage.DeleteVolume),
		rest.Get("/projects/:pid/start/:sid", storage.StartStack),
		rest.Get("/projects/:pid/stop/:sid", storage.StopStack),
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
	kubeBase  string
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

func (s *Storage) GetAllProjects(w rest.ResponseWriter, r *rest.Request) {

	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/projects", nil)
	if err != nil {
		if e, ok := err.(*etcderr.Error); ok {
			if e.ErrorCode == etcderr.EcodeKeyNotFound {
				rest.NotFound(w, r)
			}
		}
		w.WriteJson(&err)
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
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data, err := json.Marshal(project)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	opts := client.SetOptions{Dir: true}
	s.etcd.Set(context.Background(), etcdBasePath+"/projects/", pid, &opts)
	_, err = s.etcd.Set(context.Background(), etcdBasePath+"/projects/"+pid+"/project", string(data), nil)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Create the K8 namespace
	ns := k8api.Namespace{}
	ns.SetName(pid)

	client := &http.Client{}
	data, _ = json.Marshal(ns)
	url := s.kubeBase + "/api/v1/namespaces"
	request, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))

	// POST /api/v1/namespaces v1.Namespace
	request.Header.Set("Content-Type", "application/json")
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	} else {
		if httpresp.StatusCode == http.StatusCreated {
			glog.V(2).Infof("Added namespace %s\n", pid)
		} else if httpresp.StatusCode == http.StatusConflict {
			glog.V(2).Infof("Namespace exists for project %s\n", pid)
		} else {
			glog.Errorf("Error adding namespace for project %s: %s\n", pid, httpresp.Status)
		}
	}
	w.WriteHeader(http.StatusCreated)
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
		if e, ok := err.(*etcderr.Error); ok {
			if e.ErrorCode == etcderr.EcodeKeyNotFound {
				rest.NotFound(w, r)
			}
		}
		w.WriteJson(&err)
	} else {
		services := []api.Service{}
		nodes := resp.Node.Nodes
		for _, node := range nodes {
			service := api.Service{}
			json.Unmarshal([]byte(node.Value), &service)
			services = append(services, service)
		}
		w.WriteJson(&services)
	}
}

func (s *Storage) GetService(w rest.ResponseWriter, r *rest.Request) {
	key := r.PathParam("key")

	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/services/"+key, nil)

	if err != nil {
		if e, ok := err.(*etcderr.Error); ok {
			if e.ErrorCode == etcderr.EcodeKeyNotFound {
				rest.NotFound(w, r)
			}
		}
		w.WriteJson(&err)
	} else {
		service := api.Service{}
		json.Unmarshal([]byte(resp.Node.Value), &service)
		w.WriteJson(&service)
	}
}

func (s *Storage) getTemplate(key string, templateType string) (string, error) {

	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/templates/"+key+"/"+templateType, nil)

	if err != nil {
		glog.Error(err)
		return "", err
	} else {
		return resp.Node.Value, nil
	}
}

func (s *Storage) GetServiceTemplate(w rest.ResponseWriter, r *rest.Request) {
	key := r.PathParam("key")
	t := r.PathParam("type")

	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/templates/"+key+"/"+t, nil)

	if err != nil {
		if e, ok := err.(*etcderr.Error); ok {
			if e.ErrorCode == etcderr.EcodeKeyNotFound {
				rest.NotFound(w, r)
			}
		}
		w.WriteJson(&err)
	} else {
		if t == "service" {
			template := k8api.Service{}
			json.Unmarshal([]byte(resp.Node.Value), &template)
			w.WriteJson(&template)
		} else if t == "controller" {
			template := k8api.ReplicationController{}
			json.Unmarshal([]byte(resp.Node.Value), &template)
			w.WriteJson(&template)
		}
	}
}

func (s *Storage) PostService(w rest.ResponseWriter, r *rest.Request) {

	service := api.Service{}
	err := r.DecodeJsonPayload(&service)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, err := newUUID()
	service.Id = id

	data, _ := json.Marshal(service)
	resp, err := s.etcd.Set(context.Background(), etcdBasePath+"/services/"+service.Key, string(data), nil)
	w.WriteJson(&resp)
}

func (s *Storage) PutService(w rest.ResponseWriter, r *rest.Request) {
	key := r.PathParam("key")

	service := api.Service{}
	err := r.DecodeJsonPayload(&service)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data, _ := json.Marshal(service)
	resp, err := s.etcd.Set(context.Background(), etcdBasePath+"/services/"+key, string(data), nil)
	w.WriteJson(&resp)
}

func (s *Storage) PutServiceTemplate(w rest.ResponseWriter, r *rest.Request) {

	template, err := ioutil.ReadAll(r.Body)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	key := r.PathParam("key")
	t := r.PathParam("type")

	opts := client.SetOptions{Dir: true}
	s.etcd.Set(context.Background(), etcdBasePath+"/templates", key, &opts)

	resp, err := s.etcd.Set(context.Background(), etcdBasePath+"/templates/"+key+"/"+t, string(template), nil)
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

func (s *Storage) getService(key string) (*api.Service, error) {

	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/services/"+key, nil)
	if err != nil {
		glog.Error(err)
		return nil, err
	} else {
		service := api.Service{}
		node := resp.Node
		json.Unmarshal([]byte(node.Value), &service)
		return &service, nil
	}
}

func (s *Storage) GetAllStacks(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/projects/"+pid+"/stacks", nil)
	if err != nil {
		if e, ok := err.(*etcderr.Error); ok {
			if e.ErrorCode == etcderr.EcodeKeyNotFound {
				rest.NotFound(w, r)
			}
		}
		w.WriteJson(&err)
	} else {

		stacks := []api.Stack{}
		nodes := resp.Node.Nodes
		for _, node := range nodes {
			stack := api.Stack{}
			json.Unmarshal([]byte(node.Value), &stack)

			// Get the pods for this stack
			podStatus := make(map[string]string)
			pods, _ := s.getPods(pid, "stack", stack.Key)
			for _, pod := range pods {
				label := pod.Labels["name"]
				glog.V(4).Infof("Pod %s %d\n", label, len(pod.Status.Conditions))
				if len(pod.Status.Conditions) > 0 {
					podStatus[label] = string(pod.Status.Phase)
				}
			}

			k8services, _ := s.getK8Services(pid, stack.Key)
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
				if len(endpoints) > 0 {
					stackService.Endpoints = append(stackService.Endpoints, endpoints[stackService.Service])
				}
			}
			stacks = append(stacks, stack)
		}
		w.WriteJson(&stacks)
	}
}

func (s *Storage) stackExists(pid string, sid string) bool {
	stack, _ := s.getStack(pid, sid)
	if stack != nil {
		return true
	} else {
		return false
	}
}

func (s *Storage) getStack(pid string, sid string) (*api.Stack, error) {

	stack := api.Stack{}
	path := "/projects/" + pid + "/stacks/" + sid
	resp, err := s.etcd.Get(context.Background(), etcdBasePath+path, nil)

	if err != nil {
		if e, ok := err.(*etcderr.Error); ok {
			if e.ErrorCode == etcderr.EcodeKeyNotFound {
				return nil, NewError(NotFound)
			}
		} else {
			return nil, err
		}
	} else {
		json.Unmarshal([]byte(resp.Node.Value), &stack)
	}
	return &stack, nil
}

func (s *Storage) GetStack(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	sid := r.PathParam("sid")

	stack, err := s.getStack(pid, sid)
	if err != nil {
		if e, ok := err.(*Error); ok {
			if e.ErrorCode == NotFound {
				rest.NotFound(w, r)
			}
		}
	} else {
		w.WriteJson(&stack)
	}
	/*
		path := "/projects/" + pid + "/stacks/" + sid
		resp, err := s.etcd.Get(context.Background(), path, nil)

		if err != nil {
			if e, ok := err.(*etcderr.Error); ok {
				if e.ErrorCode == etcderr.EcodeKeyNotFound {
					rest.NotFound(w, r)
				}
			}
			w.WriteJson(&err)
		} else {
			stack := api.Stack{}
			json.Unmarshal([]byte(resp.Node.Value), &stack)
			w.WriteJson(&stack)
		}
	*/
}

func (s *Storage) PostStack(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")

	stack := api.Stack{}
	err := r.DecodeJsonPayload(&stack)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if s.stackExists(pid, stack.Key) {
		w.WriteHeader(http.StatusConflict)
		return
	}

	_, err = s.getService(stack.Key)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	sid, _ := newUUID()
	stack.Id = sid
	stack.Status = stackStatus[Stopped]

	for i := range stack.Services {
		sid, _ := newUUID()
		stackService := &stack.Services[i]
		stackService.Id = sid
	}

	opts := client.SetOptions{Dir: true}
	s.etcd.Set(context.Background(), etcdBasePath+"/projects/"+pid, "/stacks", &opts)

	data, _ := json.Marshal(stack)
	path := etcdBasePath + "/projects/" + pid + "/stacks/" + stack.Key
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
	for _, volume := range volumes {
		for _, ss := range stack.Services {
			if volume.Attached == ss.Id {
				glog.V(4).Infof("Detaching volume %s\n", volume.Id)
				volume.Attached = ""
				s.putVolume(pid, volume.Name, volume)
				// detach the volume
			}
		}
	}

	w.WriteHeader(http.StatusOK)
}

func (s *Storage) getVolumes(pid string) ([]api.Volume, error) {

	volumes := make([]api.Volume, 0)

	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/projects/"+pid+"/volumes", nil)
	if err != nil {
		return volumes, err
	} else {
		nodes := resp.Node.Nodes
		for _, node := range nodes {
			volume := api.Volume{}
			json.Unmarshal([]byte(node.Value), &volume)

			volumes = append(volumes, volume)
		}
	}

	return volumes, nil
}

func (s *Storage) startStackService(serviceKey string, pid string, stack *api.Stack) {

	service, _ := s.getService(serviceKey)
	for _, dep := range service.Dependencies {
		if dep.Required {
			glog.V(4).Infof("Starting required dependency %s\n", dep.DependencyKey)
			s.startController(pid, dep.DependencyKey, stack)
		} else {
			s.startStackService(dep.DependencyKey, pid, stack)
		}
	}
}

func (s *Storage) startController(pid string, serviceKey string, stack *api.Stack) (bool, error) {

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

	pods, _ := s.getPods(pid, "name", serviceKey)
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
	service, _ := s.getService(serviceKey)

	rcTemplate, _ := s.getTemplate(stackService.Service, "controller")

	k8rc := k8api.ReplicationController{}
	e := json.Unmarshal([]byte(rcTemplate), &k8rc)
	if e != nil {
		glog.Error(e)
		return true, e
	}
	//data, _ := json.Marshal(k8rc)

	if service.RequiresVolume {
		k8vols := make([]k8api.Volume, 0)
		k8vol := k8api.Volume{}
		k8vol.Name = stackService.Service
		glog.V(4).Infof("Need volume for %s \n", stackService.Service)

		volumes, _ := s.getVolumes(pid)
		found := false
		for _, volume := range volumes {
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
		k8rc.Spec.Template.Spec.Volumes = k8vols
	}

	data, _ := json.Marshal(k8rc)

	client := &http.Client{}

	url := s.kubeBase + "/api/v1/namespaces/" + pid + "/replicationcontrollers"
	request, _ := http.NewRequest("POST", url, bytes.NewBuffer([]byte(data)))
	//glog.V(4).Infof("%s\n", string(data))

	request.Header.Set("Content-Type", "application/json")
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return true, httperr
	} else {
		if httpresp.StatusCode == http.StatusCreated {
			glog.V(4).Infof("Created controller " + stackService.Service)
		} else {
			glog.V(4).Infof("Error starting controller (%d)\n", httpresp.StatusCode)
		}
	}

	// Give Kubernetes time to create the pods for the RC
	time.Sleep(time.Second * 5)

	// Wait for pods in ready state
	ready := 0

	pods, _ = s.getPods(pid, "name", service.Key)
	glog.V(4).Infof("Waiting for pod to be ready %s %d\n", service.Key, len(pods))
	for ready < len(pods) {
		for _, pod := range pods {
			if len(pod.Status.Conditions) > 0 {
				condition := pod.Status.Conditions[0]
				glog.V(4).Infof("Waiting for %s (%s=%s)\n", pod.Name, condition.Type, condition.Status)
				stackService.Status = string(pod.Status.Phase)
				if condition.Type == "Ready" && condition.Status == "True" {
					ready++
				} else {
					pods, _ = s.getPods(pid, "name", service.Key)
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
	glog.V(4).Infof("Starting stack %s", stack.Key)

	stack.Status = stackStatus[Starting]
	s.putStack(sid, sid, stack)

	stackServices := stack.Services

	// Start all Kubernetes services
	for _, stackService := range stackServices {
		service, _ := s.getService(stackService.Service)
		if service.IsService {

			glog.V(4).Infof("Starting Kubernetes service %s\n", service.Key)

			svcTemplate, _ := s.getTemplate(service.Key, "service")

			client := &http.Client{}

			url := s.kubeBase + "/api/v1/namespaces/" + pid + "/services"
			request, _ := http.NewRequest("POST", url, bytes.NewBuffer([]byte(svcTemplate)))

			request.Header.Set("Content-Type", "application/json")
			httpresp, httperr := client.Do(request)
			if httperr != nil {
				glog.Error(httperr)
				rest.Error(w, httperr.Error(), http.StatusInternalServerError)
			} else {
				if httpresp.StatusCode == http.StatusCreated {
					glog.V(4).Infof("Created Kubernetes service " + service.Key)
				} else {
					glog.Warningf("Error starting Kubernetes service (%d): %s\n", httpresp.StatusCode, httpresp.Status)
				}
			}
		}
	}

	// Start required depedencies
	s.startStackService(stack.Key, pid, stack)

	// Start optional dependencies
	for _, stackService := range stack.Services {
		s.startController(pid, stackService.Service, stack)
	}

	stack.Status = "started"
	s.putStack(pid, sid, stack)
	w.WriteJson(&stack)
}

func (s *Storage) getK8Services(pid string, stack string) ([]k8api.Service, error) {
	client := &http.Client{}

	url := s.kubeBase + "/api/v1/namespaces/" + pid + "/services?labelSelector=stack%3D" + stack
	glog.V(4).Infoln(url)
	request, _ := http.NewRequest("GET", url, nil)
	resp, err := client.Do(request)
	if err != nil {
		glog.Error(err)
		return nil, err
	} else {
		if resp.StatusCode == http.StatusOK {
			data, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return nil, err
			}

			serviceList := k8api.ServiceList{}
			services := make([]k8api.Service, len(serviceList.Items))
			json.Unmarshal(data, &serviceList)
			for _, service := range serviceList.Items {
				glog.V(4).Infof("Service %s\n", service.Name)
				services = append(services, service)
			}
			return services, nil
		} else {
			glog.Warningf("Failed to get Kubernetes services: %s %d", resp.Status, resp.StatusCode)
		}
	}
	return nil, nil
}

func (s *Storage) getPods(pid string, label string, value string) ([]k8api.Pod, error) {
	client := &http.Client{}

	url := s.kubeBase + "/api/v1/namespaces/" + pid + "/pods?labelSelector=" + label + "%3D" + value
	request, _ := http.NewRequest("GET", url, nil)
	resp, err := client.Do(request)
	if err != nil {
		glog.Error(err)
		return nil, err
	} else {
		if resp.StatusCode == http.StatusOK {
			data, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return nil, err
			}

			podList := k8api.PodList{}
			pods := make([]k8api.Pod, len(podList.Items))
			json.Unmarshal(data, &podList)
			for _, pod := range podList.Items {
				pods = append(pods, pod)
			}
			return pods, nil
		} else {
			glog.Warningf("Get pods failed: %s %d", resp.Status, resp.StatusCode)
		}
	}
	return nil, nil
}

func (s *Storage) StopStack(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	sid := r.PathParam("sid")

	stack, err := s.getStack(pid, sid)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
	}
	if stack == nil {
		rest.NotFound(w, r)
		return
	}

	err = s.stopStack(pid, sid)
	if err == nil {
		w.WriteHeader(http.StatusOK)
	} else {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *Storage) stopStack(pid string, sid string) error {

	path := "/projects/" + pid + "/stacks/" + sid
	glog.V(4).Infof("Stopping stack %s\n", path)

	stack, _ := s.getStack(pid, sid)

	if stack.Status == stackStatus[Stopping] || stack.Status == stackStatus[Stopped] {
		// Can't stop a stopped service
		glog.V(4).Infof("Can't stop a stopped service")
		return nil
	}

	stack.Status = stackStatus[Stopping]
	s.putStack(pid, sid, stack)

	stackServices := stack.Services

	for _, stackService := range stackServices {
		service, _ := s.getService(stackService.Service)
		glog.V(4).Infof("Stopping service %s\n", service.Key)

		client := &http.Client{}

		url := s.kubeBase + "/api/v1/namespaces/" + pid + "/services/" + service.Key
		request, _ := http.NewRequest("DELETE", url, nil)
		httpresp, httperr := client.Do(request)
		if httperr != nil {
			glog.Error(httperr)
			return httperr
		} else {
			if httpresp.StatusCode == http.StatusOK {
				glog.V(4).Infof("Deleted service " + service.Key)
			} else {
				glog.V(4).Infof("Error stopping service (%d)\n", httpresp.StatusCode)
			}
		}

		glog.V(4).Infof("Stopping controller %s\n", service.Key)

		url = s.kubeBase + "/api/v1/namespaces/" + pid + "/replicationcontrollers/" + service.Key
		request, _ = http.NewRequest("DELETE", url, nil)
		httpresp, httperr = client.Do(request)
		if httperr != nil {
			glog.Error(httperr)
			return httperr
		} else {
			if httpresp.StatusCode == http.StatusOK {
				glog.V(4).Infof("Deleted controller " + service.Key)
			} else {
				glog.V(4).Infof("Error stopping controller (%d)\n", httpresp.StatusCode)
			}
		}
	}
	pods, _ := s.getPods(pid, "stack", stack.Key)
	for _, pod := range pods {
		glog.V(4).Infof("Stopping pod %s\n", pod.Name)

		client := &http.Client{}

		url := s.kubeBase + "/api/v1/namespaces/" + pid + "/pods/" + pod.Name
		request, _ := http.NewRequest("DELETE", url, nil)
		httpresp, httperr := client.Do(request)
		if httperr != nil {
			glog.Error(httperr)
			return httperr
		} else {
			if httpresp.StatusCode == http.StatusOK {
				glog.V(4).Infof("Deleted pod " + pod.Name)
			} else {
				glog.V(4).Infof("Error stopping pod (%d)\n", httpresp.StatusCode)
			}
		}
	}

	stack.Status = stackStatus[Stopped]
	s.putStack(pid, sid, stack)
	return nil
}

func (s *Storage) GetAllVolumes(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/projects/"+pid+"/volumes", nil)
	if err != nil {
		if e, ok := err.(*etcderr.Error); ok {
			if e.ErrorCode == etcderr.EcodeKeyNotFound {
				rest.NotFound(w, r)
			}
		}
		w.WriteJson(&err)
	} else {
		volumes := []api.Volume{}
		nodes := resp.Node.Nodes
		for _, node := range nodes {
			volume := api.Volume{}
			json.Unmarshal([]byte(node.Value), &volume)
			volumes = append(volumes, volume)
		}
		w.WriteJson(&volumes)
	}
}

func (s *Storage) CreateVolume(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")

	vol := api.Volume{}
	err := r.DecodeJsonPayload(&vol)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if (vol.Attached == "") {
		vol.Status = "available"
	} else {
		vol.Status = "attached"
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
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		instanceId, err := s.os.GetInstanceId()
		if err != nil {
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		osName := fmt.Sprintf("ndslabs-%s-%s\n", pid, vol.Name)
		volumeId, err := s.os.CreateVolume(token.Id, s.os.TenantId, osName, vol.Size)
		if err != nil {
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		vol.Id = volumeId
		vol.Format = "cinder"

		var osVolume *openstack.Volume
		for true {
			osVolume, err = s.os.GetVolume(token.Id, s.os.TenantId, volumeId)
			if err != nil {
				rest.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			if (osVolume.Status == "available") {
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
			if (osVolume.Status == "in-use") {
				break
			}
		}
		//time.Sleep(time.Second*2)

		err = s.os.Mkfs(osVolume.Device, "xfs")
		if err != nil {
			fmt.Println(err)
			return
		}

		err = s.os.DetachVolume(token.Id, s.os.TenantId, instanceId, volumeId)
		if err != nil {
			fmt.Println(err)
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

	if (vol.Attached != "") {
		vol.Status = "available"
	} else {
		vol.Status = "attached"
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
	if err != nil {
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
 	if (volume == nil) {
		glog.V(4).Infoln("No such volume")
		if err != nil {
			glog.Error(err)
		}
		rest.NotFound(w, r)
	} else {
		glog.V(4).Infof("Format %s\n", volume.Format)
		if volume.Format == "hostPath" {
			err = os.RemoveAll(s.volDir+"/"+volume.Id)
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
		_, err := s.etcd.Delete(context.Background(), path, nil)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
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
