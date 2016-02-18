package main

import (
	"encoding/json"
	"flag"
	"github.com/ant0ine/go-json-rest/rest"
	"github.com/coreos/etcd/client"
	etcderr "github.com/coreos/etcd/error"
	"golang.org/x/net/context"
	"log"
	"net/http"
	"time"
)

func main() {

	log.SetFlags(log.LstdFlags | log.Lshortfile)

	var port, etcdAddress, corsOrigin string
	flag.StringVar(&port, "port", "8083", "Server port")
	flag.StringVar(&etcdAddress, "etcd", "localhost:4001", "etcd server address")
	flag.StringVar(&corsOrigin, "origin", "", "CORS origin")
	flag.Parse()

	log.Print("Using etcd " + etcdAddress)
	log.Print("Using port " + port)

	storage := Storage{}
	storage.client = GetEtcdClient(etcdAddress)

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

	router, err := rest.MakeRouter(
		rest.Get("/", GetPaths),
		rest.Get("/projects", storage.GetAllProjects),
		rest.Put("/projects/:id", storage.PutProject),
		rest.Get("/projects/:id", storage.GetProject),
		//rest.Delete("/projects/:id", storage.DeleteProject),
		rest.Get("/services", storage.GetAllServices),
		rest.Put("/services", storage.PutService),
		rest.Put("/services/:key", storage.PutService),
		rest.Get("/services/:key", storage.GetService),
		rest.Delete("/services/:key", storage.DeleteService),
	)

	if err != nil {
		log.Fatal(err)
	}
	api.SetApp(router)

	log.Print("Listening on " + port)
	log.Fatal(http.ListenAndServe(":"+port, api.MakeHandler()))
}

type Project struct {
	Id           string `json:"id"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	Namespace    string `json:"namespace"`
	StorageQuota int    `json:"storageQuota"`
	Password     string `json:"password"`
	EmailAddress string `json:"email"`
}

type Service struct {
	Key            string              `json:"key"`
	Label          string              `json:"label"`
	Description    string              `json:"description"`
	Maintainer     string              `json:"maintainer"`
	RequiresVolume bool                `json:"requiresVolume"`
	Tags           string              `json:"tags"`
	Dependencies   []ServiceDependency `json:"depends"`
}

type ServiceDependency struct {
	DependencyKey string `json:"key"`
	Required      bool   `json:"required"`
}

type Storage struct {
	client client.KeysAPI
}

func GetPaths(w rest.ResponseWriter, r *rest.Request) {
	paths := []string{}
	paths = append(paths, "/projects")
	paths = append(paths, "/services")
	w.WriteJson(&paths)
}

func (s *Storage) GetAllProjects(w rest.ResponseWriter, r *rest.Request) {

	resp, err := s.client.Get(context.Background(), "/projects", nil)
	if err != nil {
		if e, ok := err.(*etcderr.Error); ok {
			if e.ErrorCode == etcderr.EcodeKeyNotFound {
				rest.NotFound(w, r)
			}
		}
		w.WriteJson(&err)
	} else {
		projects := []Project{}
		nodes := resp.Node.Nodes
		for _, node := range nodes {
			project := Project{}
			json.Unmarshal([]byte(node.Value), &project)
			projects = append(projects, project)
		}
		w.WriteJson(&projects)
	}
}

func (s *Storage) GetProject(w rest.ResponseWriter, r *rest.Request) {
	id := r.PathParam("id")

	resp, err := s.client.Get(context.Background(), "/projects/"+id, nil)

	if err != nil {
		if e, ok := err.(*etcderr.Error); ok {
			if e.ErrorCode == etcderr.EcodeKeyNotFound {
				rest.NotFound(w, r)
			}
		}
		w.WriteJson(&err)
	} else {
		project := Project{}
		json.Unmarshal([]byte(resp.Node.Value), &project)
		w.WriteJson(&project)
	}
}

func (s *Storage) PutProject(w rest.ResponseWriter, r *rest.Request) {
	id := r.PathParam("id")

	project := Project{}
	err := r.DecodeJsonPayload(&project)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data, _ := json.Marshal(project)
	resp, err := s.client.Set(context.Background(), "/projects/"+id, string(data), nil)
	w.WriteJson(&resp)
}

func (s *Storage) GetAllServices(w rest.ResponseWriter, r *rest.Request) {

	resp, err := s.client.Get(context.Background(), "/services", nil)
	if err != nil {
		if e, ok := err.(*etcderr.Error); ok {
			if e.ErrorCode == etcderr.EcodeKeyNotFound {
				rest.NotFound(w, r)
			}
		}
		w.WriteJson(&err)
	} else {
		services := []Service{}
		nodes := resp.Node.Nodes
		for _, node := range nodes {
			service := Service{}
			json.Unmarshal([]byte(node.Value), &service)
			services = append(services, service)
		}
		w.WriteJson(&services)
	}
}

func (s *Storage) GetService(w rest.ResponseWriter, r *rest.Request) {
	key := r.PathParam("key")

	resp, err := s.client.Get(context.Background(), "/services/"+key, nil)

	if err != nil {
		if e, ok := err.(*etcderr.Error); ok {
			if e.ErrorCode == etcderr.EcodeKeyNotFound {
				rest.NotFound(w, r)
			}
		}
		w.WriteJson(&err)
	} else {
		service := Service{}
		json.Unmarshal([]byte(resp.Node.Value), &service)
		w.WriteJson(&service)
	}
}

func (s *Storage) PutService(w rest.ResponseWriter, r *rest.Request) {

	service := Service{}
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
	resp, err := s.client.Set(context.Background(), "/services/"+key, string(data), nil)
	w.WriteJson(&resp)
}

func (s *Storage) DeleteService(w rest.ResponseWriter, r *rest.Request) {
	key := r.PathParam("key")

	resp, err := s.client.Delete(context.Background(), "/services/"+key, nil)
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
