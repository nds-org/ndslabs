package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"github.com/ant0ine/go-json-rest/rest"
	"github.com/coreos/etcd/client"
	etcderr "github.com/coreos/etcd/error"
	api "github.com/nds-labs/apiserver/types"
	"golang.org/x/net/context"
	"io/ioutil"
	k8api "k8s.io/kubernetes/pkg/api"
	"log"
	"net/http"
	"time"
)

func main() {

	log.SetFlags(log.LstdFlags | log.Lshortfile)

	var port, etcdAddress, kubeAddress, corsOrigin string
	flag.StringVar(&port, "port", "8083", "Server port")
	flag.StringVar(&etcdAddress, "etcd", "localhost:4001", "etcd server address")
	flag.StringVar(&kubeAddress, "kube", "localhost:8080", "kube-api server address")
	flag.StringVar(&corsOrigin, "origin", "", "CORS origin")
	flag.Parse()

	log.Print("Using etcd " + etcdAddress)
	log.Print("Using kube-api " + kubeAddress)
	log.Print("Using port " + port)

	storage := Storage{}
	storage.etcd = GetEtcdClient(etcdAddress)
	storage.kubeBase = "http://" + kubeAddress //Todo: use Kube client

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

	api.Use(&rest.AuthBasicMiddleware{
		Realm: "ndslabs",
		Authenticator: func(userId string, password string) bool {
			if userId == "demo" && password == "12345" {
				storage.Namespace = userId
				return true
			}
			return false
		},
	})

	router, err := rest.MakeRouter(
		rest.Get("/", GetPaths),
		rest.Get("/projects", storage.GetAllProjects),
		rest.Put("/projects/:id", storage.PutProject),
		rest.Get("/projects/:id", storage.GetProject),
		rest.Delete("/projects/:id", storage.DeleteProject),
		rest.Get("/services", storage.GetAllServices),
		rest.Put("/services", storage.PutService),
		rest.Put("/services/:key", storage.PutService),
		rest.Get("/services/:key", storage.GetService),
		rest.Put("/services/templates/:key/:type", storage.PutServiceTemplate),
		rest.Get("/services/templates/:key/:type", storage.GetServiceTemplate),
		//rest.Delete("/services/:key/template/:type", storage.DeleteServiceTemplate),
		rest.Delete("/services/:key", storage.DeleteService),
		rest.Get("/projects/:id/config", storage.GetAllConfigs),
		rest.Put("/projects/:id/config", storage.PutConfig),
		rest.Put("/projects/:id/config/:key", storage.PutConfig),
		rest.Get("/projects/:id/config/:key", storage.GetConfig),
		rest.Delete("/projects/:id/config/:key", storage.DeleteConfig),
		rest.Get("/projects/:id/start", storage.StartConfig),
		rest.Get("/projects/:id/stop", storage.StopConfig),
		rest.Get("/projects/:id/status", storage.StatusConfig),
	)

	if err != nil {
		log.Fatal(err)
	}
	api.SetApp(router)

	log.Print("Listening on " + port)
	log.Fatal(http.ListenAndServe(":"+port, api.MakeHandler()))
}

type Storage struct {
	etcd      client.KeysAPI
	kubeBase  string
	Namespace string
}

func GetPaths(w rest.ResponseWriter, r *rest.Request) {
	paths := []string{}
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
	id := r.PathParam("id")

	resp, err := s.etcd.Get(context.Background(), "/projects/"+id, nil)

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
	id := r.PathParam("id")

	project := api.Project{}
	err := r.DecodeJsonPayload(&project)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data, _ := json.Marshal(project)
	resp, err := s.etcd.Set(context.Background(), "/projects/"+id, string(data), nil)

	// Create the K8 namespace
	ns := k8api.Namespace{}
	ns.SetName(id)

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
			fmt.Println("Added project " + id)
		} else if httpresp.StatusCode == http.StatusConflict {
			fmt.Println("Namespace exists project " + id)
		} else {
			fmt.Printf("Error adding project (%d)\n", httpresp.StatusCode)
		}
	}

	w.WriteJson(&resp)
}

func (s *Storage) DeleteProject(w rest.ResponseWriter, r *rest.Request) {
	id := r.PathParam("id")

	resp, err := s.etcd.Delete(context.Background(), "/projects/"+id, nil)
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

func (s *Storage) GetTemplate(key string, templateType string) (string, error) {

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

func (s *Storage) PutService(w rest.ResponseWriter, r *rest.Request) {

	service := api.Service{}
	err := r.DecodeJsonPayload(&service)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	key := r.PathParam("key")
	if len(key) == 0 {
		key = service.Key
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

func (s *Storage) GetConfigs(id string) ([]api.Config, error) {

	resp, err := s.etcd.Get(context.Background(), "/projects/"+id+"/config", nil)
	if err != nil {
		log.Print(err)
		return nil, err
	} else {
		configs := []api.Config{}
		nodes := resp.Node.Nodes
		for _, node := range nodes {
			config := api.Config{}
			json.Unmarshal([]byte(node.Value), &config)
			configs = append(configs, config)
			//fmt.Println(config)
		}
		return configs, nil
	}
}

func (s *Storage) GetAllConfigs(w rest.ResponseWriter, r *rest.Request) {
	id := r.PathParam("id")
	resp, err := s.etcd.Get(context.Background(), "/projects/"+id+"/config", nil)
	if err != nil {
		if e, ok := err.(*etcderr.Error); ok {
			if e.ErrorCode == etcderr.EcodeKeyNotFound {
				rest.NotFound(w, r)
			}
		}
		w.WriteJson(&err)
	} else {
		configs := []api.Config{}
		nodes := resp.Node.Nodes
		for _, node := range nodes {
			config := api.Config{}
			json.Unmarshal([]byte(node.Value), &config)
			configs = append(configs, config)
		}
		w.WriteJson(&configs)
	}
}

func (s *Storage) GetConfig(w rest.ResponseWriter, r *rest.Request) {
	id := r.PathParam("id")
	key := r.PathParam("key")

	path := "/projects/" + id + "/config/" + key
	resp, err := s.etcd.Get(context.Background(), path, nil)

	if err != nil {
		if e, ok := err.(*etcderr.Error); ok {
			if e.ErrorCode == etcderr.EcodeKeyNotFound {
				rest.NotFound(w, r)
			}
		}
		w.WriteJson(&err)
	} else {
		config := api.Config{}
		json.Unmarshal([]byte(resp.Node.Value), &config)
		w.WriteJson(&config)
	}
}

func (s *Storage) PutConfig(w rest.ResponseWriter, r *rest.Request) {
	id := r.PathParam("id")
	key := r.PathParam("key")

	config := api.Config{}
	err := r.DecodeJsonPayload(&config)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	opts := client.SetOptions{Dir: true}
	s.etcd.Set(context.Background(), "/projects/"+id, "/config", &opts)

	data, _ := json.Marshal(config)
	path := "/projects/" + id + "/config/" + key
	resp, err := s.etcd.Set(context.Background(), path, string(data), nil)
	w.WriteJson(&resp)
}

func (s *Storage) DeleteConfig(w rest.ResponseWriter, r *rest.Request) {
	id := r.PathParam("id")
	key := r.PathParam("key")

	path := "/projects/" + id + "/config/" + key
	resp, err := s.etcd.Delete(context.Background(), path, nil)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Print(resp.Action)
	w.WriteHeader(http.StatusOK)
}

func (s *Storage) StatusConfig(w rest.ResponseWriter, r *rest.Request) {
}

func (s *Storage) StartConfig(w rest.ResponseWriter, r *rest.Request) {
	id := r.PathParam("id")
	path := "/projects/" + id + "/config/"
	log.Print("Starting config " + path)

	configs, _ := s.GetConfigs(id)

	for _, config := range configs {
		fmt.Printf("Starting service %s\n", config.Key)

		svcTemplate, _ := s.GetTemplate(config.Key, "service")
		//fmt.Println(svcTemplate)

		client := &http.Client{}

		url := s.kubeBase + "/api/v1/namespaces/" + id + "/services"
		request, _ := http.NewRequest("POST", url, bytes.NewBuffer([]byte(svcTemplate)))

		request.Header.Set("Content-Type", "application/json")
		httpresp, httperr := client.Do(request)
		if httperr != nil {
			log.Fatal(httperr)
		} else {
			if httpresp.StatusCode == http.StatusCreated {
				fmt.Println("Created service " + config.Key)
			} else {
				fmt.Printf("Error starting service (%d)\n", httpresp.StatusCode)
			}
		}
	}

	for _, config := range configs {
		fmt.Printf("Starting controller %s\n", config.Key)

		rcTemplate, _ := s.GetTemplate(config.Key, "controller")

		client := &http.Client{}

		url := s.kubeBase + "/api/v1/namespaces/" + id + "/replicationcontrollers"
		request, _ := http.NewRequest("POST", url, bytes.NewBuffer([]byte(rcTemplate)))

		request.Header.Set("Content-Type", "application/json")
		httpresp, httperr := client.Do(request)
		if httperr != nil {
			log.Fatal(httperr)
		} else {
			if httpresp.StatusCode == http.StatusCreated {
				fmt.Println("Created service " + config.Key)
			} else {
				fmt.Printf("Error starting service (%d)\n", httpresp.StatusCode)
			}
		}
	}
}

func (s *Storage) GetPods(id string) ([]string, error) {
	client := &http.Client{}

	url := s.kubeBase + "/api/v1/namespaces/" + id + "/pods"
	request, _ := http.NewRequest("GET", url, nil)
	resp, err := client.Do(request)
	if err != nil {
		return nil, err
	} else {
		if resp.StatusCode == http.StatusOK {
			template, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return nil, err
			}
			podList := k8api.PodList{}
			pods := make([]string, len(podList.Items))
			json.Unmarshal(template, &podList)
			for _, pod := range podList.Items {
				pods = append(pods, pod.Name)
			}
			return pods, nil
		}
	}
	return nil, nil
}

func (s *Storage) StopConfig(w rest.ResponseWriter, r *rest.Request) {
	id := r.PathParam("id")
	path := "/projects/" + id + "/config/"
	log.Print("Starting config " + path)

	configs, _ := s.GetConfigs(id)

	for _, config := range configs {
		fmt.Printf("Stopping service %s\n", config.Key)

		client := &http.Client{}

		url := s.kubeBase + "/api/v1/namespaces/" + id + "/services/" + config.Key
		request, _ := http.NewRequest("DELETE", url, nil)
		httpresp, httperr := client.Do(request)
		if httperr != nil {
			log.Fatal(httperr)
		} else {
			if httpresp.StatusCode == http.StatusOK {
				fmt.Println("Deleted service " + config.Key)
			} else {
				fmt.Printf("Error stopping service (%d)\n", httpresp.StatusCode)
			}
		}

		fmt.Printf("Stopping controller %s\n", config.Key)

		url = s.kubeBase + "/api/v1/namespaces/" + id + "/replicationcontrollers/" + config.Key
		request, _ = http.NewRequest("DELETE", url, nil)
		httpresp, httperr = client.Do(request)
		if httperr != nil {
			log.Fatal(httperr)
		} else {
			if httpresp.StatusCode == http.StatusCreated {
				fmt.Println("Deleted controller " + config.Key)
			} else {
				fmt.Printf("Error stopping controller (%d)\n", httpresp.StatusCode)
			}
		}
	}
	pods, _ := s.GetPods(id)
	for _, pod := range pods {
		fmt.Printf("Stopping pod %s\n", pod)

		client := &http.Client{}

		url := s.kubeBase + "/api/v1/namespaces/" + id + "/pods/" + pod
		request, _ := http.NewRequest("DELETE", url, nil)
		httpresp, httperr := client.Do(request)
		if httperr != nil {
			log.Fatal(httperr)
		} else {
			if httpresp.StatusCode == http.StatusOK {
				fmt.Println("Deleted pod " + pod)
			} else {
				fmt.Printf("Error stopping pod (%d)\n", httpresp.StatusCode)
			}
		}
	}
}
