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
	api "github.com/nds-labs/apiserver/types"
	"golang.org/x/net/context"
	"io"
	"io/ioutil"
	k8api "k8s.io/kubernetes/pkg/api"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"
)

func main() {

	log.SetFlags(log.LstdFlags | log.Lshortfile)

	var port, etcdAddress, kubeAddress, corsOrigin, openStackAddress, volDir string
	var jwtKeyPath, host string
	flag.StringVar(&port, "port", "8083", "Server port")
	flag.StringVar(&etcdAddress, "etcd", "localhost:4001", "etcd server address")
	flag.StringVar(&kubeAddress, "kube", "localhost:8080", "kube-api server address")
	flag.StringVar(&openStackAddress, "openstack", "", "OpenStack api server address")
	flag.StringVar(&corsOrigin, "origin", "", "CORS origin")
	flag.StringVar(&volDir, "vol-dir", "/tmp/volumes", "Directory for hostPath volumes")
	flag.StringVar(&jwtKeyPath, "jwtKeyPath", "jwt.pem", "Path to JWT signing key")
	flag.StringVar(&host, "host", "localhost", "Hostname of API server")
	flag.Parse()

	log.Print("Using etcd " + etcdAddress)
	log.Print("Using kube-api " + kubeAddress)
	log.Print("Using port " + port)
	log.Print("Using openstack api " + openStackAddress)
	log.Print("Using volume dir " + volDir)
	log.Print("Using JWT key  " + jwtKeyPath)
	log.Print("Using host  " + host)

	storage := Storage{}
	storage.etcd = GetEtcdClient(etcdAddress)
	storage.kubeBase = "http://" + kubeAddress //Todo: use Kube client
	if len(openStackAddress) > 0 {
		storage.local = false
		storage.openStackEndpoint = openStackAddress
	} else {
		storage.local = true
		storage.volDir = volDir
	}

	jwtKey, err := ioutil.ReadFile(jwtKeyPath)
	storage.jwtKey = jwtKey
	storage.host = host

	api := rest.NewApi()
	api.Use(rest.DefaultDevStack...)

	if len(corsOrigin) > 0 {
		log.Print("Using CORS origin " + corsOrigin)

		api.Use(&rest.CorsMiddleware{
			RejectNonCorsRequests: false,
			OriginValidator: func(origin string, request *rest.Request) bool {
				return origin == corsOrigin
			},
			AllowedMethods: []string{"GET", "POST", "PUT"},
			AllowedHeaders: []string{
				"Accept", "Content-Type", "X-Custom-Header", "Origin"},
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
			return userId == "demo" && password == "12345"
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
		rest.Put("/services/templates/:key/:type", storage.PutServiceTemplate),
		rest.Get("/services/templates/:key/:type", storage.GetServiceTemplate),
		//rest.Delete("/services/:id/template/:type", storage.DeleteServiceTemplate),
		rest.Get("/projects/:pid/stacks", storage.GetAllStacks),
		rest.Post("/projects/:pid/stacks", storage.PostStack),
		rest.Put("/projects/:pid/stacks/:sid", storage.PutStack),
		rest.Get("/projects/:pid/stacks/:sid", storage.GetStack),
		rest.Delete("/projects/:pid/stacks/:sid", storage.DeleteStack),
		rest.Get("/projects/:pid/volumes", storage.GetAllVolumes),
		rest.Put("/projects/:pid/volumes", storage.CreateVolume),
		rest.Put("/projects/:pid/volumes/:vid", storage.PutVolume),
		rest.Get("/projects/:pid/volumes/:vid", storage.GetVolume),
		rest.Get("/projects/:pid/start/:sid", storage.StartStack),
		rest.Get("/projects/:pid/stop/:sid", storage.StopStack),
	)

	if err != nil {
		log.Fatal(err)
	}
	api.SetApp(router)

	log.Print("Listening on " + port)
	log.Fatal(http.ListenAndServe(":"+port, api.MakeHandler()))
}

type Storage struct {
	etcd              client.KeysAPI
	kubeBase          string
	Namespace         string
	openStackEndpoint string
	local             bool
	volDir            string
	host              string
	jwtKey            []byte
}

func GetPaths(w rest.ResponseWriter, r *rest.Request) {
	paths := []string{}
	paths = append(paths, "/authenticate")
	paths = append(paths, "/projects")
	paths = append(paths, "/services")
	w.WriteJson(&paths)
}

func (s *Storage) GetAllProjects(w rest.ResponseWriter, r *rest.Request) {

	resp, err := s.etcd.Get(context.Background(), "/projects", nil)
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

	resp, err := s.etcd.Get(context.Background(), "/projects/"+pid, nil)

	if err != nil {
		if e, ok := err.(*etcderr.Error); ok {
			if e.ErrorCode == etcderr.EcodeKeyNotFound {
				rest.NotFound(w, r)
			}
		}
		w.WriteJson(&err)
	} else {
		project := api.Project{}
		json.Unmarshal([]byte(resp.Node.Value), &project)
		w.WriteJson(&project)
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

	data, _ := json.Marshal(project)
	resp, err := s.etcd.Set(context.Background(), "/projects/"+pid, string(data), nil)

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
		log.Fatal(httperr)
	} else {
		if httpresp.StatusCode == http.StatusCreated {
			fmt.Println("Added project " + pid)
		} else if httpresp.StatusCode == http.StatusConflict {
			fmt.Println("Namespace exists project " + pid)
		} else {
			fmt.Printf("Error adding project (%d)\n", httpresp.StatusCode)
		}
	}

	w.WriteJson(&resp)
}

func (s *Storage) DeleteProject(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")

	resp, err := s.etcd.Delete(context.Background(), "/projects/"+pid, nil)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Print(resp.Action)

	w.WriteHeader(http.StatusOK)
}

func (s *Storage) GetAllServices(w rest.ResponseWriter, r *rest.Request) {

	resp, err := s.etcd.Get(context.Background(), "/services", nil)
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

	resp, err := s.etcd.Get(context.Background(), "/services/"+key, nil)

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

	resp, err := s.etcd.Get(context.Background(), "/services/templates/"+key+"/"+templateType, nil)

	if err != nil {
		log.Print(err)
		return "", err
	} else {
		return resp.Node.Value, nil
	}
}

func (s *Storage) GetServiceTemplate(w rest.ResponseWriter, r *rest.Request) {
	key := r.PathParam("key")
	t := r.PathParam("type")

	resp, err := s.etcd.Get(context.Background(), "/services/templates/"+key+"/"+t, nil)

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
	resp, err := s.etcd.Set(context.Background(), "/services/"+service.Key, string(data), nil)
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
	resp, err := s.etcd.Set(context.Background(), "/services/"+key, string(data), nil)
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
	s.etcd.Set(context.Background(), "/services", "/templates", &opts)
	s.etcd.Set(context.Background(), "/services/templates", key, &opts)

	resp, err := s.etcd.Set(context.Background(), "/services/templates/"+key+"/"+t, string(template), nil)
	w.WriteJson(&resp)
}

func (s *Storage) DeleteService(w rest.ResponseWriter, r *rest.Request) {
	key := r.PathParam("key")

	resp, err := s.etcd.Delete(context.Background(), "/services/"+key, nil)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Print(resp.Action)

	w.WriteHeader(http.StatusOK)
}

func GetEtcdClient(etcdAddress string) client.KeysAPI {
	cfg := client.Config{
		Endpoints: []string{"http://" + etcdAddress},
		Transport: client.DefaultTransport,
		// set timeout per request to fail fast when the target endpoint is unavailable
		HeaderTimeoutPerRequest: time.Second,
	}
	c, err := client.New(cfg)
	if err != nil {
		log.Fatal(err)
	}
	kapi := client.NewKeysAPI(c)

	resp, err := kapi.Get(context.Background(), "/", nil)
	_ = resp
	if err != nil {
		log.Fatal(err)
	}

	return kapi
}

func (s *Storage) getService(key string) (api.Service, error) {

	var service api.Service
	resp, err := s.etcd.Get(context.Background(), "/services/"+key, nil)
	if err != nil {
		log.Print(err)
		return service, err
	} else {
		service := api.Service{}
		node := resp.Node
		json.Unmarshal([]byte(node.Value), &service)
		return service, nil
	}
}

func (s *Storage) getStack(pid string, sid string) (api.Stack, error) {
	var stack api.Stack
	resp, err := s.etcd.Get(context.Background(), "/projects/"+pid+"/stacks/"+sid, nil)
	if err != nil {
		log.Print(err)
		return stack, err
	} else {
		stack := api.Stack{}
		node := resp.Node
		json.Unmarshal([]byte(node.Value), &stack)
		return stack, nil
	}
}

func (s *Storage) GetAllStacks(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	resp, err := s.etcd.Get(context.Background(), "/projects/"+pid+"/stacks", nil)
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
				fmt.Printf("Pod %s %d\n", label, len(pod.Status.Conditions))
				if len(pod.Status.Conditions) > 0 {
					podStatus[label] = string(pod.Status.Phase)
				}
			}

			endpoints := make(map[string]string)
			k8services, _ := s.getK8Services(pid, stack.Key)
			for _, k8service := range k8services {
				fmt.Printf("Service : %s %s\n", k8service.Name, k8service.Spec.Type)
				if k8service.Spec.Type == "NodePort" {
					endpoints[k8service.GetName()] = fmt.Sprintf("http://%s:%d", s.host, k8service.Spec.Ports[0].NodePort)
				}
			}

			for i := range stack.Services {
				stackService := &stack.Services[i]
				fmt.Printf("Stack Service %s %s\n", stackService.Service, podStatus[stackService.Service])
				stackService.Status = podStatus[stackService.Service]
				stackService.Endpoints = append(stackService.Endpoints, endpoints[stackService.Service])
			}
			stacks = append(stacks, stack)
		}
		w.WriteJson(&stacks)
	}
}

func (s *Storage) GetStack(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	sid := r.PathParam("sid")

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
}

func (s *Storage) PostStack(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")

	stack := api.Stack{}
	err := r.DecodeJsonPayload(&stack)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	sid, _ := newUUID()
	stack.Id = sid

	for i := range stack.Services {
		sid, _ := newUUID()
		stackService := &stack.Services[i]
		stackService.Id = sid
	}

	opts := client.SetOptions{Dir: true}
	s.etcd.Set(context.Background(), "/projects/"+pid, "/stacks", &opts)

	data, _ := json.Marshal(stack)
	path := "/projects/" + pid + "/stacks/" + stack.Key
	_, err = s.etcd.Set(context.Background(), path, string(data), nil)
	w.WriteJson(&stack)
}

func (s *Storage) PutStack(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	sid := r.PathParam("sid")

	stack := api.Stack{}
	err := r.DecodeJsonPayload(&stack)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	opts := client.SetOptions{Dir: true}
	s.etcd.Set(context.Background(), "/projects/"+pid, "/stacks", &opts)

	data, _ := json.Marshal(stack)
	path := "/projects/" + pid + "/stacks/" + sid
	_, err = s.etcd.Set(context.Background(), path, string(data), nil)
	w.WriteJson(&stack)
}

func (s *Storage) DeleteStack(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	sid := r.PathParam("sid")

	path := "/projects/" + pid + "/stacks/" + sid
	resp, err := s.etcd.Delete(context.Background(), path, nil)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Print(resp.Action)
	w.WriteHeader(http.StatusOK)
}

func (s *Storage) getVolumes(pid string) ([]api.Volume, error) {

	volumes := make([]api.Volume, 0)

	resp, err := s.etcd.Get(context.Background(), "/projects/"+pid+"/volumes", nil)
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

func (s *Storage) startStackService(serviceKey string, pid string, stack api.Stack) {

	fmt.Printf("Starting controllers for %s\n", serviceKey)

	service, _ := s.getService(serviceKey)
	for _, dep := range service.Dependencies {
		if dep.Required {
			s.startStackService(dep.DependencyKey, pid, stack)
		}
	}
	for _, dep := range service.Dependencies {
		if !dep.Required {
			s.startStackService(dep.DependencyKey, pid, stack)
		}
	}
	s.startController(pid, service.Key, stack)
}

func (s *Storage) startController(pid string, serviceKey string, stack api.Stack) {

	stackService := api.StackService{}
	found := false
	for _, ss := range stack.Services {
		if ss.Service == serviceKey {
			stackService = ss
			found = true
		}
	}
	if !found {
		return
	}

	service, _ := s.getService(serviceKey)

	rcTemplate, _ := s.getTemplate(stackService.Service, "controller")

	//fmt.Println(string(rcTemplate))

	k8rc := k8api.ReplicationController{}
	json.Unmarshal([]byte(rcTemplate), &k8rc)
	//data, _ := json.Marshal(k8rc)

	if service.RequiresVolume {
		k8vols := make([]k8api.Volume, 0)
		k8vol := k8api.Volume{}
		k8vol.Name = stackService.Service

		volumes, _ := s.getVolumes(pid)
		found := false
		for _, volume := range volumes {
			if volume.AttachedTo == stackService.Id {
				fmt.Printf("Found volume %s\n", volume.AttachedTo)
				found = true

				if volume.Format == "hostPath" {
					k8hostPath := k8api.HostPathVolumeSource{}
					k8hostPath.Path = s.volDir + "/" + volume.Id
					k8vol.HostPath = &k8hostPath
					k8vols = append(k8vols, k8vol)
					fmt.Printf("Attaching %s\n", s.volDir+"/"+volume.Id)
				} else {
					log.Println("Warning: invalid volume format\n")
				}
			}
		}
		if !found {
			log.Println("Warning: required volume not found, using emptyDir\n")
			k8empty := k8api.EmptyDirVolumeSource{}
			k8vol.EmptyDir = &k8empty
			k8vols = append(k8vols, k8vol)
		}
		k8rc.Spec.Template.Spec.Volumes = k8vols
	}

	data, _ := json.Marshal(k8rc)
	//fmt.Println(string(data))

	client := &http.Client{}

	url := s.kubeBase + "/api/v1/namespaces/" + pid + "/replicationcontrollers"
	request, _ := http.NewRequest("POST", url, bytes.NewBuffer([]byte(data)))

	request.Header.Set("Content-Type", "application/json")
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		log.Fatal(httperr)
	} else {
		if httpresp.StatusCode == http.StatusCreated {
			fmt.Println("Created controller " + stackService.Service)
		} else {
			fmt.Printf("Error starting controller (%d)\n", httpresp.StatusCode)
		}
	}

	// Give Kubernetes time to create the pods for the RC
	time.Sleep(time.Second * 5)

	// Wait for pods in ready state
	ready := 0

	pods, _ := s.getPods(pid, "name", service.Key)
	fmt.Printf("Waiting for pods %s %d\n", service.Key, len(pods))
	for ready < len(pods) {
		for _, pod := range pods {
			if len(pod.Status.Conditions) > 0 {
				condition := pod.Status.Conditions[0]
				fmt.Printf("%s %s %s\n", condition.Type, condition.Status, pod.Name)
				if condition.Type == "Ready" && condition.Status == "True" {
					ready++
				} else {
					pods, _ = s.getPods(pid, "name", service.Key)
					time.Sleep(time.Second * 5)
				}
			}
		}
	}

}

func (s *Storage) StartStack(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	sid := r.PathParam("sid")

	stack, _ := s.getStack(pid, sid)
	log.Print("Starting stack " + stack.Key)

	stackServices := stack.Services

	// Start all Kubernetes services
	for _, stackService := range stackServices {
		service, _ := s.getService(stackService.Service)
		if service.IsService {

			fmt.Printf("Starting service %s\n", service.Key)

			svcTemplate, _ := s.getTemplate(service.Key, "service")
			//fmt.Println(svcTemplate)

			client := &http.Client{}

			url := s.kubeBase + "/api/v1/namespaces/" + pid + "/services"
			request, _ := http.NewRequest("POST", url, bytes.NewBuffer([]byte(svcTemplate)))

			request.Header.Set("Content-Type", "application/json")
			httpresp, httperr := client.Do(request)
			if httperr != nil {
				log.Fatal(httperr)
			} else {
				if httpresp.StatusCode == http.StatusCreated {
					fmt.Println("Created service " + service.Key)
				} else {
					fmt.Printf("Error starting service (%d): %s\n", httpresp.StatusCode, httpresp.Status)
				}
			}
		}
	}

	s.startStackService(stack.Key, pid, stack)
	/*
		for _, stackService := range stackServices {

			service, _ := s.getService(stackService.Service)
			fmt.Printf("Starting controller %s\n", service.Key)

			rcTemplate, _ := s.getTemplate(service.Key, "controller")
			//fmt.Println(string(rcTemplate))

			k8rc := k8api.ReplicationController{}
			json.Unmarshal([]byte(rcTemplate), &k8rc)
			//data, _ := json.Marshal(k8rc)

			if service.RequiresVolume {
				k8vols := make([]k8api.Volume, 0)
				k8vol := k8api.Volume{}
				k8vol.Name = service.Key

				volumes, _ := s.getVolumes(pid)
				found := false
				for _, volume := range volumes {
					if volume.AttachedTo == stackService.Id {
						fmt.Printf("Found volume %s\n", volume.AttachedTo)
						found = true

						if volume.Format == "hostPath" {
							k8hostPath := k8api.HostPathVolumeSource{}
							k8hostPath.Path = s.volDir + "/" + volume.Id
							k8vol.HostPath = &k8hostPath
							k8vols = append(k8vols, k8vol)
							fmt.Printf("Attaching %s\n", s.volDir+"/"+volume.Id)
						} else {
							log.Println("Warning: invalid volume format\n")
						}
					}
				}
				if !found {
					log.Println("Warning: required volume note found, using emptyDir\n")
					k8empty := k8api.EmptyDirVolumeSource{}
					k8vol.EmptyDir = &k8empty
					k8vols = append(k8vols, k8vol)
				}
				k8rc.Spec.Template.Spec.Volumes = k8vols
			}

			data, _ := json.Marshal(k8rc)
			fmt.Println(string(data))

			client := &http.Client{}

			url := s.kubeBase + "/api/v1/namespaces/" + pid + "/replicationcontrollers"
			request, _ := http.NewRequest("POST", url, bytes.NewBuffer([]byte(data)))

			request.Header.Set("Content-Type", "application/json")
			httpresp, httperr := client.Do(request)
			if httperr != nil {
				log.Fatal(httperr)
			} else {
				if httpresp.StatusCode == http.StatusCreated {
					fmt.Println("Created controller " + service.Key)
				} else {
					fmt.Printf("Error starting controller (%d)\n", httpresp.StatusCode)
				}
			}
		}
	*/
	w.WriteJson(&stack)
}

func (s *Storage) getK8Services(pid string, stack string) ([]k8api.Service, error) {
	client := &http.Client{}

	url := s.kubeBase + "/api/v1/namespaces/" + pid + "/services?labelSelector=stack%3D" + stack
	fmt.Println(url)
	request, _ := http.NewRequest("GET", url, nil)
	resp, err := client.Do(request)
	if err != nil {
		log.Println(err)
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
				fmt.Printf("Service %s\n", service.Name)
				services = append(services, service)
			}
			fmt.Printf("Num services %d\n", len(services))
			return services, nil
		} else {
			fmt.Print("Failed to get Kubernetes services: %s %d", resp.Status, resp.StatusCode)
		}
	}
	return nil, nil
}
func (s *Storage) getPods(pid string, label string, value string) ([]k8api.Pod, error) {
	client := &http.Client{}

	url := s.kubeBase + "/api/v1/namespaces/" + pid + "/pods?labelSelector=" + label + "%3D" + value
	//fmt.Println(url)
	request, _ := http.NewRequest("GET", url, nil)
	resp, err := client.Do(request)
	if err != nil {
		log.Println(err)
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
			fmt.Print("Get pods failed: %s %d", resp.Status, resp.StatusCode)
		}
	}
	return nil, nil
}

func (s *Storage) StopStack(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	sid := r.PathParam("sid")
	path := "/projects/" + pid + "/stacks/" + sid
	log.Print("Stopping stack " + path)

	stack, _ := s.getStack(pid, sid)
	stackServices := stack.Services

	for _, stackService := range stackServices {
		service, _ := s.getService(stackService.Service)
		fmt.Printf("Stopping service %s\n", service.Key)

		client := &http.Client{}

		url := s.kubeBase + "/api/v1/namespaces/" + pid + "/services/" + service.Key
		request, _ := http.NewRequest("DELETE", url, nil)
		httpresp, httperr := client.Do(request)
		if httperr != nil {
			log.Fatal(httperr)
		} else {
			if httpresp.StatusCode == http.StatusOK {
				fmt.Println("Deleted service " + service.Key)
			} else {
				fmt.Printf("Error stopping service (%d)\n", httpresp.StatusCode)
			}
		}

		fmt.Printf("Stopping controller %s\n", service.Key)

		url = s.kubeBase + "/api/v1/namespaces/" + pid + "/replicationcontrollers/" + service.Key
		request, _ = http.NewRequest("DELETE", url, nil)
		httpresp, httperr = client.Do(request)
		if httperr != nil {
			log.Fatal(httperr)
		} else {
			if httpresp.StatusCode == http.StatusOK {
				fmt.Println("Deleted controller " + service.Key)
			} else {
				fmt.Printf("Error stopping controller (%d)\n", httpresp.StatusCode)
			}
		}
	}
	pods, _ := s.getPods(pid, "stack", stack.Key)
	for _, pod := range pods {
		fmt.Printf("Stopping pod %s\n", pod.Name)

		client := &http.Client{}

		url := s.kubeBase + "/api/v1/namespaces/" + pid + "/pods/" + pod.Name
		request, _ := http.NewRequest("DELETE", url, nil)
		httpresp, httperr := client.Do(request)
		if httperr != nil {
			log.Fatal(httperr)
		} else {
			if httpresp.StatusCode == http.StatusOK {
				fmt.Println("Deleted pod " + pod.Name)
			} else {
				fmt.Printf("Error stopping pod (%d)\n", httpresp.StatusCode)
			}
		}
	}
}

func (s *Storage) GetAllVolumes(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	resp, err := s.etcd.Get(context.Background(), "/projects/"+pid+"/volumes", nil)
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
	size := r.Request.FormValue("size")
	stackService := r.Request.FormValue("uid")

	if s.local {
		uid, err := newUUID()
		if err != nil {
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		err = os.Mkdir(s.volDir+"/"+uid, 0755)
		if err != nil {
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		vol := api.Volume{}
		vol.Id = uid
		vol.Size, err = strconv.Atoi(size)
		if err != nil {
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		vol.Format = "hostPath"
		vol.Status = "available"
		vol.AttachedTo = stackService

		opts := client.SetOptions{Dir: true}
		s.etcd.Set(context.Background(), "/projects/"+pid, "/volumes", &opts)

		data, _ := json.Marshal(vol)
		fmt.Println("Json: " + string(data))
		path := "/projects/" + pid + "/volumes/" + vol.Id
		_, err = s.etcd.Set(context.Background(), path, string(data), nil)
		w.WriteJson(&vol)
	}
}

func (s *Storage) PutVolume(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	vid := r.PathParam("vid")

	volume := api.Volume{}
	err := r.DecodeJsonPayload(&volume)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Create volume via Openstack API
	// Attach volume to current host
	// run mkfs
	// detach volume
	/*
		cmd := exec.Command("tr", "a-z", "A-Z")
		cmd.Stdin = strings.NewReader("some input")
		var out bytes.Buffer
		cmd.Stdout = &out
		err := cmd.Run()
		if err != nil {
			log.Fatal(err)
		}
		fmt.Printf("in all caps: %q\n", out.String())
	*/

	opts := client.SetOptions{Dir: true}
	s.etcd.Set(context.Background(), "/projects/"+pid, "/volumes", &opts)

	data, _ := json.Marshal(volume)
	path := "/projects/" + pid + "/volumes/" + vid
	resp, err := s.etcd.Set(context.Background(), path, string(data), nil)
	w.WriteJson(&resp)
}

func (s *Storage) GetVolume(w rest.ResponseWriter, r *rest.Request) {
	pid := r.PathParam("pid")
	vid := r.PathParam("vid")

	path := "/projects/" + pid + "/volumes/" + vid
	resp, err := s.etcd.Get(context.Background(), path, nil)

	if err != nil {
		if e, ok := err.(*etcderr.Error); ok {
			if e.ErrorCode == etcderr.EcodeKeyNotFound {
				rest.NotFound(w, r)
			}
		}
		w.WriteJson(&err)
	} else {
		volume := api.Volume{}
		json.Unmarshal([]byte(resp.Node.Value), &volume)
		w.WriteJson(&volume)
	}
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

/*
func (s *Storage) newToken(user string) (string, error) {
	token := jwt.New(jwt.SigningMethodHS256)
	token.Claims["sub"] = user
	token.Claims["exp"] = fmt.Sprintf("%d", time.Now().Add(time.Second*5).Unix())
	tokenString, err := token.SignedString(s.jwtKey)
	if err != nil {
		log.Fatalln(err)
	}
	return tokenString, err
}

func (s *Storage) parseToken(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		exp, _ := strconv.ParseInt(token.Claims["exp"].(string), 10, 64)
		fmt.Printf("%d %d\n", exp, time.Now().Unix())
		if time.Now().Unix() > exp {
			return nil, fmt.Errorf("Token expired\n")
		}
		return s.jwtKey, nil
	})

	fmt.Printf("sub: %s\n", token.Claims["sub"])
	if err != nil {
		fmt.Println(err.Error())
		return "", err
	}

	return token.Claims["sub"].(string), err
}
*/
