// Copyright © 2016 National Data Service
package main

import (
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

	email "github.com/ndslabs/apiserver/pkg/email"
	etcd "github.com/ndslabs/apiserver/pkg/etcd"
	kube "github.com/ndslabs/apiserver/pkg/kube"
	mw "github.com/ndslabs/apiserver/pkg/middleware"
	api "github.com/ndslabs/apiserver/pkg/types"
	validate "github.com/ndslabs/apiserver/pkg/validate"
	version "github.com/ndslabs/apiserver/pkg/version"
	gcfg "gopkg.in/gcfg.v1"
	k8api "k8s.io/kubernetes/pkg/api"
	"k8s.io/kubernetes/pkg/watch"

	"github.com/StephanDollberg/go-json-rest-middleware-jwt"
	"github.com/ant0ine/go-json-rest/rest"
	jwtbase "github.com/dgrijalva/jwt-go"
	"github.com/golang/glog"
)

var adminUser = "admin"
var systemNamespace = "kube-system"
var glusterPodName = "glfs-server-global"

type Server struct {
	etcd           *etcd.EtcdHelper
	kube           *kube.KubeHelper
	validator      *validate.Validator
	email          *email.EmailHelper
	Namespace      string
	local          bool
	volDir         string
	volName        string
	hostname       string
	jwt            *jwt.JWTMiddleware
	prefix         string
	ingress        IngressType
	domain         string
	cpuMax         int
	cpuDefault     int
	memMax         int
	memDefault     int
	storageDefault int
	origin         string
}

type Config struct {
	Server struct {
		Port         string
		Origin       string
		VolDir       string
		VolName      string
		SpecsDir     string
		VolumeSource string
		Timeout      int
		Prefix       string
		Domain       string
		Ingress      IngressType
	}
	DefaultLimits struct {
		CpuMax         int
		CpuDefault     int
		MemMax         int
		MemDefault     int
		StorageDefault int
	}
	Etcd struct {
		Address string
	}
	Kubernetes struct {
		Address   string
		TokenPath string
		Username  string
		Password  string
	}
	Email struct {
		Host         string
		Port         int
		SupportEmail string
	}
}

type IngressType string

const (
	IngressTypeLoadBalancer IngressType = "LoadBalancer"
	IngressTypeNodePort     IngressType = "NodePort"
)

var defaultTimeout = 600

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
	if cfg.Kubernetes.TokenPath == "" {
		cfg.Kubernetes.TokenPath = "/run/secrets/kubernetes.io/serviceaccount/token"
	}
	if cfg.DefaultLimits.MemMax <= 0 {
		cfg.DefaultLimits.MemMax = 8196 //M
	}
	if cfg.DefaultLimits.MemDefault <= 0 {
		cfg.DefaultLimits.MemDefault = 100 //M
	}
	if cfg.DefaultLimits.CpuMax <= 0 {
		cfg.DefaultLimits.CpuMax = 2000 //m
	}
	if cfg.DefaultLimits.CpuDefault <= 0 {
		cfg.DefaultLimits.CpuDefault = 1000 //m
	}
	if cfg.DefaultLimits.StorageDefault <= 0 {
		cfg.DefaultLimits.StorageDefault = 10
	}
	glog.Infof("Using account defaults: max memory=%d M, max cpu=%d m, max storage = %d GB\n")

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
		cfg.Kubernetes.Username, cfg.Kubernetes.Password, cfg.Kubernetes.TokenPath)
	if err != nil {
		glog.Errorf("Kubernetes API server not available\n")
		glog.Fatal(err)
	}

	email, err := email.NewEmailHelper(cfg.Email.Host, cfg.Email.Port, cfg.Email.SupportEmail, cfg.Server.Origin)
	if err != nil {
		glog.Errorf("Error in email server configuration\n")
		glog.Fatal(err)
	}

	server := Server{}
	server.hostname = hostname
	if cfg.Server.Ingress == IngressTypeLoadBalancer {
		if len(cfg.Server.Domain) > 0 {
			server.domain = cfg.Server.Domain
		} else {
			glog.Fatal("Domain must be specified for ingress type LoadBalancer")
		}
	}
	server.etcd = etcd
	server.kube = kube
	server.email = email
	server.volDir = cfg.Server.VolDir
	server.volName = cfg.Server.VolName
	server.cpuMax = cfg.DefaultLimits.CpuMax
	server.cpuDefault = cfg.DefaultLimits.CpuDefault
	server.memMax = cfg.DefaultLimits.MemMax
	server.memDefault = cfg.DefaultLimits.MemDefault
	server.storageDefault = cfg.DefaultLimits.StorageDefault

	server.ingress = IngressTypeNodePort
	if cfg.Server.Ingress != "" {
		server.ingress = cfg.Server.Ingress
	}

	server.prefix = "/api/"
	if cfg.Server.Prefix != "" {
		server.prefix = cfg.Server.Prefix
	}
	server.start(cfg, adminPasswd)

}

func (s *Server) start(cfg Config, adminPasswd string) {

	glog.Infof("Starting NDS Labs API server (%s %s)", version.VERSION, version.BUILD_DATE)
	glog.Infof("etcd %s ", cfg.Etcd.Address)
	glog.Infof("kube-apiserver %s", cfg.Kubernetes.Address)
	glog.Infof("volume dir %s", cfg.Server.VolDir)
	glog.Infof("specs dir %s", cfg.Server.SpecsDir)
	glog.Infof("port %s", cfg.Server.Port)
	os.MkdirAll(cfg.Server.VolDir, 0700)

	api := rest.NewApi()
	api.Use(rest.DefaultDevStack...)
	api.Use(&mw.NoCacheMiddleware{})

	glog.Infof("prefix %s", s.prefix)

	if len(cfg.Server.Origin) > 0 {
		glog.Infof("CORS origin %s\n", cfg.Server.Origin)
		s.origin = cfg.Server.Origin

		api.Use(&rest.CorsMiddleware{
			RejectNonCorsRequests: false,
			OriginValidator: func(origin string, request *rest.Request) bool {
				// NDS-552
				return origin == cfg.Server.Origin || origin == cfg.Server.Origin+"."
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

	glog.Infof("domain %s", cfg.Server.Domain)
	glog.Infof("ingress %s", cfg.Server.Ingress)

	jwt := &jwt.JWTMiddleware{
		Key:        []byte(s.hostname),
		Realm:      "ndslabs",
		Timeout:    timeout,
		MaxRefresh: time.Hour * 24,
		Authenticator: func(userId string, password string) bool {
			if userId == adminUser && password == adminPasswd {
				return true
			} else {
				return s.etcd.CheckPassword(userId, password) && s.etcd.CheckAccess(userId)
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
			if userId == adminUser {
				payload[adminUser] = true
			}
			payload["server"] = s.hostname
			payload["user"] = userId
			return payload
		},
	}
	s.jwt = jwt

	api.Use(&rest.IfMiddleware{
		Condition: func(request *rest.Request) bool {
			return strings.HasPrefix(request.URL.Path, s.prefix+"accounts") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"services") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"change_password") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"stacks") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"start") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"stop") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"logs") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"volumes") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"configs") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"check_token") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"refresh_token") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"support") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"check_console")
		},
		IfTrue: jwt,
	})

	routes := make([]*rest.Route, 0)

	routes = append(routes,
		rest.Get(s.prefix, s.GetPaths),
		rest.Get(s.prefix+"version", Version),
		rest.Post(s.prefix+"authenticate", jwt.LoginHandler),
		rest.Delete(s.prefix+"authenticate", s.Logout),
		rest.Get(s.prefix+"check_token", s.CheckToken),
		rest.Get(s.prefix+"refresh_token", jwt.RefreshHandler),
		rest.Get(s.prefix+"accounts", s.GetAllAccounts),
		rest.Post(s.prefix+"accounts", s.PostAccount),
		rest.Post(s.prefix+"register", s.RegisterAccount),
		rest.Put(s.prefix+"register/verify", s.VerifyAccount),
		rest.Get(s.prefix+"register/approve", s.ApproveAccount),
		rest.Get(s.prefix+"register/deny", s.DenyAccount),
		rest.Put(s.prefix+"accounts/:userId", s.PutAccount),
		rest.Get(s.prefix+"accounts/:userId", s.GetAccount),
		rest.Post(s.prefix+"reset/:userId", s.ResetPassword),
		rest.Delete(s.prefix+"accounts/:userId", s.DeleteAccount),
		rest.Get(s.prefix+"services", s.GetAllServices),
		rest.Post(s.prefix+"services", s.PostService),
		rest.Put(s.prefix+"services/:key", s.PutService),
		rest.Get(s.prefix+"services/:key", s.GetService),
		rest.Delete(s.prefix+"services/:key", s.DeleteService),
		rest.Get(s.prefix+"configs", s.GetConfigs),
		rest.Get(s.prefix+"stacks", s.GetAllStacks),
		rest.Post(s.prefix+"stacks", s.PostStack),
		rest.Put(s.prefix+"stacks/:sid", s.PutStack),
		rest.Get(s.prefix+"stacks/:sid", s.GetStack),
		rest.Delete(s.prefix+"stacks/:sid", s.DeleteStack),
		rest.Get(s.prefix+"start/:sid", s.StartStack),
		rest.Get(s.prefix+"stop/:sid", s.StopStack),
		rest.Get(s.prefix+"logs/:ssid", s.GetLogs),
		rest.Get(s.prefix+"console", s.GetConsole),
		rest.Get(s.prefix+"check_console", s.CheckConsole),
		rest.Get(s.prefix+"vocabulary/:name", s.GetVocabulary),
		rest.Put(s.prefix+"stacks/:sid/rename", s.RenameStack),
		rest.Put(s.prefix+"change_password", s.ChangePassword),
		rest.Post(s.prefix+"support", s.PostSupport),
		rest.Get(s.prefix+"contact", s.GetContact),
		rest.Get(s.prefix+"healthz", s.GetHealthz),
	)

	router, err := rest.MakeRouter(routes...)

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
		s.addVocabulary(cfg.Server.SpecsDir + "/vocab/tags.json")
		s.validator = validate.NewValidator(cfg.Server.SpecsDir + "/schemas/spec-schema.json")
	}

	s.createAdminUser(adminPasswd)
	go s.initExistingAccounts()

	go s.kube.WatchEvents(s)
	go s.kube.WatchPods(s)

	http.Handle(s.prefix, api.MakeHandler())
	http.HandleFunc(s.prefix+"download", s.DownloadClient)

	glog.Infof("Listening on %s", cfg.Server.Port)
	glog.Fatal(http.ListenAndServe(":"+cfg.Server.Port, nil))
}

func (s *Server) CheckConsole(w rest.ResponseWriter, r *rest.Request) {
	userId := s.getUser(r)
	ssid := r.Request.FormValue("ssid")

	if !s.kube.NamespaceExists(userId) || !s.stackServiceExists(userId, ssid) {
		rest.NotFound(w, r)
		return
	} else {
		w.WriteHeader(http.StatusOK)
		return
	}
}

func (s *Server) GetConsole(w rest.ResponseWriter, r *rest.Request) {
	userId := r.Request.FormValue("namespace")
	ssid := r.Request.FormValue("ssid")

	if !s.kube.NamespaceExists(userId) || !s.stackServiceExists(userId, ssid) {
		rest.NotFound(w, r)
		return
	}

	pods, _ := s.kube.GetPods(userId, "name", ssid)
	pod := pods[0].Name
	container := pods[0].Spec.Containers[0].Name
	glog.V(4).Infof("exec called for %s %s %s\n", userId, ssid, pod)
	s.kube.Exec(userId, pod, container, s.kube).ServeHTTP(w.(http.ResponseWriter), r.Request)

}

func (s *Server) initExistingAccounts() {
	accounts, err := s.etcd.GetAccounts()
	if err != nil {
		glog.Error(err)
		return
	}

	for _, account := range *accounts {
		if !s.kube.NamespaceExists(account.Namespace) {
			s.kube.CreateNamespace(account.Namespace)

			if account.ResourceLimits.CPUMax > 0 &&
				account.ResourceLimits.MemoryMax > 0 {
				s.kube.CreateResourceQuota(account.Namespace,
					account.ResourceLimits.CPUMax,
					account.ResourceLimits.MemoryMax)
				s.kube.CreateLimitRange(account.Namespace,
					account.ResourceLimits.CPUDefault,
					account.ResourceLimits.MemoryDefault)
			}
		}

		stacks, err := s.etcd.GetStacks(account.Namespace)
		if err != nil {
			glog.Error(err)
		}
		for _, stack := range *stacks {

			if stack.Status == "starting" || stack.Status == "started" {
				_, err = s.startStack(account.Namespace, &stack)
				if err != nil {
					glog.Errorf("Error starting stack %s %s\n", account.Namespace, stack.Id)
					glog.Error(err)
				}
			} else if stack.Status == "stopping" {
				_, err = s.stopStack(account.Namespace, stack.Id)
				if err != nil {
					glog.Errorf("Error stopping stack %s %s\n", account.Namespace, stack.Id)
					glog.Error(err)
				}
			}
		}
	}
}

func (s *Server) GetPaths(w rest.ResponseWriter, r *rest.Request) {
	paths := []string{}
	paths = append(paths, s.prefix+"accounts")
	paths = append(paths, s.prefix+"authenticate")
	paths = append(paths, s.prefix+"change_password")
	paths = append(paths, s.prefix+"configs")
	paths = append(paths, s.prefix+"console")
	paths = append(paths, s.prefix+"contact")
	paths = append(paths, s.prefix+"healthz")
	paths = append(paths, s.prefix+"logs")
	paths = append(paths, s.prefix+"register")
	paths = append(paths, s.prefix+"reset")
	paths = append(paths, s.prefix+"services")
	paths = append(paths, s.prefix+"stacks")
	paths = append(paths, s.prefix+"start")
	paths = append(paths, s.prefix+"stop")
	paths = append(paths, s.prefix+"support")
	paths = append(paths, s.prefix+"version")
	paths = append(paths, s.prefix+"vocabulary")
	w.WriteJson(&paths)
}

func Version(w rest.ResponseWriter, r *rest.Request) {
	w.WriteJson(fmt.Sprintf("%s %s", version.VERSION, version.BUILD_DATE))
}

func (s *Server) CheckToken(w rest.ResponseWriter, r *rest.Request) {
	w.WriteHeader(http.StatusOK)
}

func (s *Server) Logout(w rest.ResponseWriter, r *rest.Request) {
	w.WriteHeader(http.StatusOK)
}

func (s *Server) GetAllAccounts(w rest.ResponseWriter, r *rest.Request) {

	if !s.IsAdmin(r) {
		rest.Error(w, "", http.StatusUnauthorized)
		return
	}

	accounts, err := s.etcd.GetAccounts()
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		w.WriteJson(&err)
	} else {
		w.WriteJson(&accounts)
	}
}

func (s *Server) getUser(r *rest.Request) string {
	payload := r.Env["JWT_PAYLOAD"].(map[string]interface{})
	if payload[adminUser] == true {
		return ""
	} else {
		return payload["user"].(string)
	}
}

func (s *Server) IsAdmin(r *rest.Request) bool {
	payload := r.Env["JWT_PAYLOAD"].(map[string]interface{})
	if payload[adminUser] == true {
		return true
	} else {
		return false
	}
}

func (s *Server) GetAccount(w rest.ResponseWriter, r *rest.Request) {
	userId := r.PathParam("userId")

	// Check IsAdmin or userId = current user
	if !(s.IsAdmin(r) || s.getUser(r) == userId) {
		rest.Error(w, "", http.StatusUnauthorized)
		return
	}

	glog.V(4).Infof("Getting account %s\n", userId)
	account, err := s.etcd.GetAccount(userId)
	if err != nil {
		rest.NotFound(w, r)
	} else {
		glog.V(4).Infof("Getting quotas for %s\n", userId)
		quota, err := s.kube.GetResourceQuota(userId)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
		} else {
			glog.V(4).Infof("Usage: %d %d \n", quota.Items[0].Status.Used.Memory().Value(), quota.Items[0].Status.Hard.Memory().Value())
			account.ResourceUsage = api.ResourceUsage{
				CPU:       quota.Items[0].Status.Used.Cpu().String(),
				Memory:    quota.Items[0].Status.Used.Memory().String(),
				CPUPct:    fmt.Sprintf("%f", float64(quota.Items[0].Status.Used.Cpu().Value())/float64(quota.Items[0].Status.Hard.Cpu().Value())),
				MemoryPct: fmt.Sprintf("%f", float64(quota.Items[0].Status.Used.Memory().Value())/float64(quota.Items[0].Status.Hard.Memory().Value())),
			}
		}
		account.Password = ""
		account.Token = ""
		w.WriteJson(account)
	}
}

func (s *Server) PostAccount(w rest.ResponseWriter, r *rest.Request) {

	if !s.IsAdmin(r) {
		rest.Error(w, "", http.StatusUnauthorized)
		return
	}

	account := api.Account{}
	err := r.DecodeJsonPayload(&account)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if s.accountExists(account.Namespace) {
		w.WriteHeader(http.StatusConflict)
		return
	}

	err = s.etcd.PutAccount(account.Namespace, &account, true)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = s.setupAccount(&account)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = s.createBasicAuthSecret(account.Namespace)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteJson(&account)
}

func (s *Server) createBasicAuthSecret(uid string) error {
	account, err := s.etcd.GetAccount(uid)
	if err != nil {
		glog.Error(err)
		return err
	}

	_, err = s.kube.CreateBasicAuthSecret(account.Namespace, account.Namespace, account.Password)
	if err != nil {
		glog.Error(err)
		return err
	}

	err = s.updateIngress(uid)
	if err != nil {
		glog.Error(err)
		return err
	}
	return nil
}

func (s *Server) updateIngress(uid string) error {

	ingresses, err := s.kube.GetIngresses(uid)
	if err != nil {
		glog.Error(err)
		return err
	}
	if ingresses != nil {
		for _, ingress := range ingresses {
			glog.V(4).Infof("Touching ingress %s\n", ingress.Name)
			_, err = s.kube.CreateUpdateIngress(uid, &ingress, true)
			if err != nil {
				glog.Error(err)
				return err
			}
		}
	}

	return nil
}

func (s *Server) createLMABasicAuthSecret() error {
	if s.kube.NamespaceExists(systemNamespace) {
		account, err := s.etcd.GetAccount(adminUser)
		if err != nil {
			glog.Error(err)
			return err
		}

		_, err = s.kube.CreateBasicAuthSecret(systemNamespace, adminUser, account.Password)
		if err != nil {
			glog.Error(err)
			return err
		}
	}

	err := s.updateIngress(systemNamespace)
	if err != nil {
		glog.Error(err)
		return err
	}
	return nil
}

func (s *Server) setupAccount(account *api.Account) error {
	_, err := s.kube.CreateNamespace(account.Namespace)
	if err != nil {
		return err
	}

	if account.ResourceLimits == (api.AccountResourceLimits{}) {
		glog.Warningf("No resource limits specified for account %s, using defaults\n", account.Name)
		account.ResourceLimits = api.AccountResourceLimits{
			CPUMax:        s.cpuMax,
			CPUDefault:    s.cpuDefault,
			MemoryMax:     s.memMax,
			MemoryDefault: s.memDefault,
			StorageQuota:  s.storageDefault,
		}
	}
	_, err = s.kube.CreateResourceQuota(account.Namespace,
		account.ResourceLimits.CPUMax,
		account.ResourceLimits.MemoryMax)
	if err != nil {
		return err
	}

	_, err = s.kube.CreateLimitRange(account.Namespace,
		account.ResourceLimits.CPUDefault,
		account.ResourceLimits.MemoryDefault)
	if err != nil {
		return err
	}

	secret, err := s.kube.GetSecret("default", "ndslabs-tls-secret")
	if secret != nil {
		secretName := fmt.Sprintf("%s-tls-secret", account.Namespace)
		_, err := s.kube.CreateTLSSecret(account.Namespace, secretName, secret.Data["tls.crt"], secret.Data["tls.key"])
		if err != nil {
			return err
		}
	}

	_, err = s.updateStorageQuota(account)
	if err != nil {
		return err
	}

	err = s.createBasicAuthSecret(account.Namespace)
	if err != nil {
		return err
	}
	return nil
}

// Registers an account for this user and sends a verification email message
func (s *Server) RegisterAccount(w rest.ResponseWriter, r *rest.Request) {

	account := api.Account{}
	err := r.DecodeJsonPayload(&account)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if s.accountExists(account.Namespace) {
		rest.Error(w, "Username is in use", http.StatusConflict)
		return
	}

	if s.emailExists(account.EmailAddress) {
		rest.Error(w, "Email address is already associated with another account", http.StatusConflict)
		return
	}

	// Set the account status to unverified
	account.Status = api.AccountStatusUnverified

	// Put account generates the registration token
	err = s.etcd.PutAccount(account.Namespace, &account, true)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	verifyUrl := s.origin + "/#/?t=" + account.Token + "&u=" + account.Namespace
	err = s.email.SendVerificationEmail(account.Name, account.EmailAddress, verifyUrl)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteJson(&account)
}

func (s *Server) VerifyAccount(w rest.ResponseWriter, r *rest.Request) {
	data := make(map[string]string)
	err := r.DecodeJsonPayload(&data)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	userId := data["u"]
	token := data["t"]
	account, err := s.etcd.GetAccount(userId)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if account.Status == api.AccountStatusUnverified &&
		account.Token == token {
		account.Status = api.AccountStatusUnapproved
		err = s.etcd.PutAccount(userId, account, false)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		err = s.email.SendVerifiedEmail(account.Name, account.EmailAddress)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		approveUrl := r.BaseUrl().String() + "/api/register/approve?t=" + account.Token + "&u=" + account.Namespace
		denyUrl := r.BaseUrl().String() + "/api/register/deny?t=" + account.Token + "&u=" + account.Namespace
		err = s.email.SendNewAccountEmail(account, approveUrl, denyUrl)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	} else {
		w.WriteHeader(http.StatusNotFound)
	}
}

func (s *Server) ApproveAccount(w rest.ResponseWriter, r *rest.Request) {
	userId := r.Request.FormValue("u")
	token := r.Request.FormValue("t")

	account, err := s.etcd.GetAccount(userId)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if account.Status == api.AccountStatusUnapproved &&
		account.Token == token {
		account.Status = api.AccountStatusApproved
		err = s.etcd.PutAccount(userId, account, false)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		err = s.setupAccount(account)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		err = s.email.SendStatusEmail(account.Name, account.EmailAddress, s.origin, true)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.WriteJson(map[string]string{"message": "Account has been approved."})
	} else {
		rest.Error(w, "Token not found", http.StatusNotFound)
	}
}

func (s *Server) DenyAccount(w rest.ResponseWriter, r *rest.Request) {
	userId := r.Request.FormValue("u")
	token := r.Request.FormValue("t")
	account, err := s.etcd.GetAccount(userId)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if account.Status == api.AccountStatusUnapproved &&
		account.Token == token {
		account.Status = api.AccountStatusDenied
		err = s.etcd.PutAccount(userId, account, false)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		err = s.email.SendStatusEmail(account.Name, account.EmailAddress, "", false)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.WriteJson(map[string]string{"message": "Account has been denied."})
	} else {
		rest.Error(w, "Token not found", http.StatusNotFound)
	}
}

func (s *Server) updateStorageQuota(account *api.Account) (bool, error) {

	err := os.MkdirAll(s.volDir+"/"+account.Namespace, 0777|os.ModeSticky)
	if err != nil {
		return false, err
	}

	// Get the GFS server pods
	gfs, err := s.kube.GetPods(systemNamespace, "name", glusterPodName)
	if err != nil {
		return false, err
	}
	if len(gfs) > 0 {
		cmd := []string{"gluster", "volume", "quota", s.volName, "limit-usage", "/" + account.Namespace, fmt.Sprintf("%dGB", account.ResourceLimits.StorageQuota)}
		_, err := s.kube.ExecCommand(systemNamespace, gfs[0].Name, cmd)
		if err != nil {
			return false, err
		}
	} else {
		glog.V(2).Info("No GFS servers found, cannot set account quota")
	}
	return true, nil
}

// For now, just call the status command and see if it returns an error
func (s *Server) getGlusterStatus() (bool, error) {

	// Get the GFS server pods
	gfs, err := s.kube.GetPods(systemNamespace, "name", glusterPodName)
	if err != nil {
		return false, err
	}
	if len(gfs) > 0 {
		cmd := []string{"gluster", "volume", "status", s.volName}
		_, err := s.kube.ExecCommand(systemNamespace, gfs[0].Name, cmd)
		if err != nil {
			return false, err
		}
	} else {
		glog.V(2).Info("No GFS servers found, GFS not enabled")
	}
	return true, nil
}

func (s *Server) PutAccount(w rest.ResponseWriter, r *rest.Request) {
	userId := r.PathParam("userId")

	// Check IsAdmin or userId = current user
	if !(s.IsAdmin(r) || s.getUser(r) == userId) {
		rest.Error(w, "", http.StatusUnauthorized)
		return
	}

	account := api.Account{}
	err := r.DecodeJsonPayload(&account)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = s.updateStorageQuota(&account)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = s.etcd.PutAccount(userId, &account, true)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = s.createBasicAuthSecret(userId)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteJson(&account)
}

func (s *Server) DeleteAccount(w rest.ResponseWriter, r *rest.Request) {
	userId := r.PathParam("userId")

	glog.V(4).Infof("DeleteAccount %s", userId)

	if !s.IsAdmin(r) {
		rest.Error(w, "", http.StatusUnauthorized)
		return
	}
	if userId == "admin" {
		rest.Error(w, "", http.StatusForbidden)
		return
	}

	if !s.accountExists(userId) {
		rest.NotFound(w, r)
		return
	}

	if s.kube.NamespaceExists(userId) {
		_, err := s.kube.DeleteNamespace(userId)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	err := s.etcd.DeleteAccount(userId)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = os.RemoveAll(s.volDir + "/" + userId)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (s *Server) GetAllServices(w rest.ResponseWriter, r *rest.Request) {
	userId := s.getUser(r)
	catalog := r.Request.FormValue("catalog")

	if catalog == "system" {
		services, err := s.etcd.GetGlobalServices()
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteJson(&services)
	} else if catalog == "all" {
		services, err := s.etcd.GetAllServices(userId)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteJson(&services)
	} else {
		services, err := s.etcd.GetServices(userId)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteJson(&services)
	}
}

func (s *Server) GetService(w rest.ResponseWriter, r *rest.Request) {
	key := r.PathParam("key")
	catalog := r.Request.FormValue("catalog")
	userId := s.getUser(r)

	glog.V(4).Infof("GetService %s\n", key)

	if catalog == "system" {
		if !s.serviceExists(userId, key) {
			rest.NotFound(w, r)
			return
		}
		spec, err := s.etcd.GetServiceSpec(userId, key)
		if err != nil {
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		} else {
			w.WriteJson(&spec)
		}
	} else {

		if !s.serviceExists(userId, key) {
			rest.NotFound(w, r)
			return
		}
		spec, err := s.etcd.GetServiceSpec(userId, key)
		if err != nil {
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		} else {
			w.WriteJson(&spec)
		}
	}
}

func (s *Server) PostService(w rest.ResponseWriter, r *rest.Request) {
	userId := s.getUser(r)
	catalog := r.Request.FormValue("catalog")

	service := api.ServiceSpec{}
	err := r.DecodeJsonPayload(&service)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	ok, err := s.validator.ValidateSpec(&service)
	if !ok {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if s.serviceExists(userId, service.Key) {
		rest.Error(w, "Service exists with key", http.StatusConflict)
		return
	}

	dep, ok := s.checkDependencies(userId, &service)
	if !ok {
		glog.Warningf("Cannot add service, dependency %s missing\n", dep)
		rest.Error(w, fmt.Sprintf("Missing dependency %s", dep), http.StatusNotFound)
	}

	cf, ok := s.checkConfigs(userId, &service)
	if !ok {
		glog.Warningf("Cannot add service, config dependency %s missing\n", cf)
		rest.Error(w, fmt.Sprintf("Missing config dependency %s", cf), http.StatusNotFound)
		return
	}

	if catalog == "system" {
		if !s.IsAdmin(r) {
			rest.Error(w, "", http.StatusUnauthorized)
			return
		}

		err = s.etcd.PutGlobalService(service.Key, &service)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		glog.V(1).Infof("Added system service %s\n", service.Key)
	} else {
		// Don't allow privileged services in user catalogs
		service.Privileged = false

		// Always require auth on user catalog services
		service.AuthRequired = true

		err = s.etcd.PutService(userId, service.Key, &service)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		glog.V(1).Infof("Added user %s service %s\n", userId, service.Key)
	}

	w.WriteHeader(http.StatusOK)
}

func (s *Server) PutService(w rest.ResponseWriter, r *rest.Request) {
	userId := s.getUser(r)
	key := r.PathParam("key")
	catalog := r.Request.FormValue("catalog")

	service := api.ServiceSpec{}
	err := r.DecodeJsonPayload(&service)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	ok, err := s.validator.ValidateSpec(&service)
	if !ok {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	dep, ok := s.checkDependencies(userId, &service)
	if !ok {
		glog.Warningf("Cannot add service, dependency %s missing\n", dep)
		rest.Error(w, fmt.Sprintf("Missing dependency %s", dep), http.StatusNotFound)
	}
	cf, ok := s.checkConfigs(userId, &service)
	if !ok {
		glog.Warningf("Cannot add service, config dependency %s missing\n", cf)
		rest.Error(w, fmt.Sprintf("Missing config dependency %s", cf), http.StatusNotFound)
		return
	}

	if catalog == "system" {
		if !s.IsAdmin(r) {
			rest.Error(w, "", http.StatusUnauthorized)
			return
		}

		if s.serviceInUse(key) > 0 {
			glog.Warningf("Cannot update service spec %s because it is in use by one or more accounts\n", key)
			rest.Error(w, "Service is in use", http.StatusConflict)
			return
		}

		err = s.etcd.PutGlobalService(key, &service)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		glog.V(1).Infof("Updated system service %s\n", key)
	} else {
		if s.serviceInUse(key) > 0 {
			glog.Warningf("Cannot update service spec %s because it is in use by one or more accounts\n", key)
			rest.Error(w, "Service is in use", http.StatusConflict)
			return
		}
		// Don't allow privileged services in user catalogs
		service.Privileged = false

		// Always require auth on user catalog services
		service.AuthRequired = true

		err = s.etcd.PutService(userId, key, &service)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		glog.V(1).Infof("Updated user %s service %s\n", userId, key)
	}
	w.WriteJson(&service)
}

func (s *Server) DeleteService(w rest.ResponseWriter, r *rest.Request) {
	key := r.PathParam("key")
	catalog := r.Request.FormValue("catalog")
	userId := s.getUser(r)

	glog.V(4).Infof("DeleteService %s %s %s\n", key, catalog, userId)

	if catalog == "system" {
		if !s.IsAdmin(r) {
			rest.Error(w, "", http.StatusUnauthorized)
			return
		}

		if !s.serviceExists(userId, key) {
			rest.Error(w, "No such service", http.StatusNotFound)
			return
		}

		if s.serviceIsDependencyGlobal(key) > 0 {
			glog.Warningf("Cannot delete system service spec %s because it is required by one or more services\n", key)
			rest.Error(w, "Required by another service", http.StatusConflict)
			return
		}

		if s.serviceInUse(key) > 0 {
			glog.Warningf("Cannot delete system service spec %s because it is in use by one or more accounts\n", key)
			rest.Error(w, "Service is in use", http.StatusConflict)
			return
		}

		err := s.etcd.DeleteGlobalService(key)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		glog.V(1).Infof("Deleted system service %s\n", key)
	} else {
		service, _ := s.etcd.GetServiceSpec(userId, key)
		if service == nil || service.Catalog != "user" {
			rest.Error(w, "No such service", http.StatusNotFound)
			return
		}

		if s.serviceIsDependency(userId, key) > 0 {
			glog.Warningf("Cannot delete user service spec %s because it is required by one or more services\n", key)
			rest.Error(w, "Required by another service", http.StatusConflict)
			return
		}

		if s.serviceInUse(key) > 0 {
			glog.Warningf("Cannot delete user service spec %s because it is in use by one or more accounts\n", key)
			rest.Error(w, "Service is in use", http.StatusConflict)
			return
		}

		err := s.etcd.DeleteService(userId, key)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

	}
	w.WriteHeader(http.StatusOK)
}

func (s *Server) serviceInUse(sid string) int {
	inUse := 0
	accounts, err := s.etcd.GetAccounts()
	if err != nil {
		glog.Errorf("Error getting accounts\n")
	}
	if accounts != nil {
		for _, account := range *accounts {
			stacks, _ := s.etcd.GetStacks(account.Namespace)
			for _, stack := range *stacks {
				for _, service := range stack.Services {
					if service.Service == sid {
						inUse++
					}
				}
			}
		}
	}
	return inUse
}

func (s *Server) GetAllStacks(w rest.ResponseWriter, r *rest.Request) {
	userId := s.getUser(r)

	stacks, err := s.getStacks(userId)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		w.WriteJson(&err)
	} else {
		w.WriteJson(&stacks)
	}
}

func (s *Server) getStacks(userId string) (*[]api.Stack, error) {

	stacks := []api.Stack{}
	stks, err := s.etcd.GetStacks(userId)
	if err == nil {
		for _, stack := range *stks {
			stack, _ := s.getStackWithStatus(userId, stack.Id)
			stacks = append(stacks, *stack)
		}
	}
	return &stacks, nil
}

func (s *Server) isStackStopped(userId string, ssid string) bool {
	sid := ssid[0:strings.LastIndex(ssid, "-")]
	stack, _ := s.etcd.GetStack(userId, sid)

	if stack != nil && stack.Status == stackStatus[Stopped] {
		return true
	} else {
		return false
	}
}

func (s *Server) getStackService(userId string, ssid string) *api.StackService {
	if strings.Index(ssid, "-") < 0 {
		return nil
	}
	sid := ssid[0:strings.LastIndex(ssid, "-")]
	stack, _ := s.etcd.GetStack(userId, sid)
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

func (s *Server) accountExists(userId string) bool {
	accounts, _ := s.etcd.GetAccounts()
	if accounts == nil {
		return false
	}

	exists := false
	for _, account := range *accounts {
		if account.Namespace == userId {
			exists = true
			break
		}
	}
	return exists
}

func (s *Server) emailExists(email string) bool {
	accounts, _ := s.etcd.GetAccounts()
	if accounts == nil {
		return false
	}

	exists := false
	for _, account := range *accounts {
		if account.EmailAddress == email {
			exists = true
			break
		}
	}
	return exists
}

func (s *Server) stackServiceExists(userId string, id string) bool {
	stacks, _ := s.getStacks(userId)
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

func (s *Server) stackExists(userId string, name string) bool {
	stacks, _ := s.getStacks(userId)
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

func (s *Server) serviceIsDependencyGlobal(sid string) int {
	services, _ := s.etcd.GetGlobalServices()
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

func (s *Server) serviceIsDependency(sid string, userId string) int {
	services, _ := s.etcd.GetServices(userId)
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

func (s *Server) serviceExists(uid string, sid string) bool {
	service, _ := s.etcd.GetServiceSpec(uid, sid)
	if service != nil {
		return true
	} else {
		return false
	}
}

func (s *Server) GetStack(w rest.ResponseWriter, r *rest.Request) {
	userId := s.getUser(r)
	sid := r.PathParam("sid")

	stack, err := s.getStackWithStatus(userId, sid)
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
	userId := s.getUser(r)

	stack := api.Stack{}
	err := r.DecodeJsonPayload(&stack)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	glog.V(4).Infof("Adding stack %s %s\n", stack.Key, stack.Name)

	_, err = s.etcd.GetServiceSpec(userId, stack.Key)
	if err != nil {
		glog.V(4).Infof("Service %s not found for user %s\n", stack.Key, userId)

		w.WriteHeader(http.StatusNotFound)
		return
	}

	sid := s.kube.GenerateName(5)
	stack.Id = sid
	stack.Status = stackStatus[Stopped]

	for i := range stack.Services {
		stackService := &stack.Services[i]
		stackService.Id = fmt.Sprintf("%s-%s", sid, stackService.Service)
		spec, _ := s.etcd.GetServiceSpec(userId, stackService.Service)
		if spec != nil {
			for _, mount := range spec.VolumeMounts {
				if mount.Type == api.MountTypeDocker {
					continue
				}

				glog.V(4).Infof("Looking for mount %s\n", mount.MountPath)
				found := false
				for _, toPath := range stackService.VolumeMounts {
					if toPath == mount.MountPath && len(toPath) > 0 {
						found = true
					}
				}

				if !found {
					glog.V(4).Infof("Didn't find mount %s, creating temporary folder\n", mount.MountPath)
					// Create a new temporary folder
					if stackService.VolumeMounts == nil {
						stackService.VolumeMounts = map[string]string{}
					}
					volPath := fmt.Sprintf("AppData/%s", s.getAppDataDir(stackService.Id))

					stackService.VolumeMounts[volPath] = mount.MountPath
				}
			}

			// Start the Kubernetes service and ingress
			if len(spec.Ports) > 0 {
				_, err := s.createKubernetesService(userId, &stack, spec)
				if err != nil {
					glog.V(4).Infof("Failed to start service service %s-%s\n", stack.Id, spec.Key)
					continue
				}
			}
		}
	}

	err = s.etcd.PutStack(userId, stack.Id, &stack)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteJson(&stack)
}

// Create the Kubernetes service and ingress rules
func (s *Server) createKubernetesService(userId string, stack *api.Stack, spec *api.ServiceSpec) (*k8api.Service, error) {
	name := fmt.Sprintf("%s-%s", stack.Id, spec.Key)
	template := s.kube.CreateServiceTemplate(name, stack.Id, spec, s.useNodePort())

	svc, err := s.kube.GetService(userId, name)
	if svc == nil {
		glog.V(4).Infof("Starting Kubernetes service %s\n", name)
		svc, err = s.kube.StartService(userId, template)
		if err != nil {
			glog.Errorf("Error starting service %s\n", name)
			glog.Error(err)
			return nil, err
		}

		if s.useLoadBalancer() && spec.Access == api.AccessExternal {
			s.createIngressRule(userId, svc, stack)
		}
	}
	return svc, nil
}

func (s *Server) createIngressRule(userId string, svc *k8api.Service, stack *api.Stack) error {
	secretName := fmt.Sprintf("%s-tls-secret", userId)

	host := fmt.Sprintf("%s.%s", svc.Name, s.domain)
	_, err := s.kube.CreateIngress(userId, host, svc.Name,
		int(svc.Spec.Ports[0].Port), secretName, stack.Secure)
	if err != nil {
		glog.Errorf("Error creating ingress for %s\n", svc.Name)
		glog.Error(err)
		return err
	}
	glog.V(4).Infof("Started ingress %s for service %s (secure=%t)\n", host, svc.Name, stack.Secure)
	return nil
}

func (s *Server) PutStack(w rest.ResponseWriter, r *rest.Request) {
	userId := s.getUser(r)
	sid := r.PathParam("sid")

	newStack := api.Stack{}
	err := r.DecodeJsonPayload(&newStack)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	oldStack, err := s.etcd.GetStack(userId, sid)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for i := range newStack.Services {
		stackService := &newStack.Services[i]

		oldStackService := oldStack.GetStackService(stackService.Id)
		if oldStackService == nil {

			// User added a new service
			stackService.Id = fmt.Sprintf("%s-%s", sid, stackService.Service)
			spec, _ := s.etcd.GetServiceSpec(userId, stackService.Service)
			if spec != nil {
				_, err := s.createKubernetesService(userId, &newStack, spec)
				if err != nil {
					glog.Error(err)
					rest.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
			}
		}

		if oldStack.Secure != newStack.Secure {
			// Need to delete and recreate the ingress rule
			spec, _ := s.etcd.GetServiceSpec(userId, stackService.Service)
			name := fmt.Sprintf("%s-%s", newStack.Id, spec.Key)
			svc, _ := s.kube.GetService(userId, name)
			if s.useLoadBalancer() && spec.Access == api.AccessExternal {
				err := s.createIngressRule(userId, svc, &newStack)
				if err != nil {
					glog.Error(err)
					rest.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
			}
		}

		// User may have changed volume mounts
		spec, _ := s.etcd.GetServiceSpec(userId, stackService.Service)
		if spec != nil {
			for _, mount := range spec.VolumeMounts {

				found := 0
				for fromPath, toPath := range stackService.VolumeMounts {
					if toPath == mount.MountPath && len(toPath) > 0 {
						found++
					}

					if len(fromPath) == 0 {
						volPath := fmt.Sprintf("AppData/%s", s.getAppDataDir(stackService.Id))
						stackService.VolumeMounts[volPath] = mount.MountPath
					}
				}

				if found > 1 {
					glog.Error(fmt.Sprintf("Two volume mounts cannot refer to the same to path\n"))
					w.WriteHeader(http.StatusConflict)
					return
				}

				if found == 0 {
					// Create a new temporary folder
					volPath := fmt.Sprintf("AppData/%s", s.getAppDataDir(stackService.Id))
					stackService.VolumeMounts[volPath] = mount.MountPath
				}
			}
		}
	}

	newStack.Status = stackStatus[Stopped]
	err = s.etcd.PutStack(userId, sid, &newStack)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteJson(&newStack)
}

func (s *Server) RenameStack(w rest.ResponseWriter, r *rest.Request) {
	userId := s.getUser(r)
	sid := r.PathParam("sid")

	data := make(map[string]string)
	err := r.DecodeJsonPayload(&data)
	stack, err := s.etcd.GetStack(userId, sid)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	stack.Name = data["name"]

	err = s.etcd.PutStack(userId, sid, stack)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteJson(&stack)
}

func (s *Server) DeleteStack(w rest.ResponseWriter, r *rest.Request) {

	userId := s.getUser(r)
	sid := r.PathParam("sid")

	stack, err := s.etcd.GetStack(userId, sid)
	if stack == nil {
		rest.NotFound(w, r)
		return
	}

	if stack.Status == stackStatus[Started] ||
		stack.Status == stackStatus[Starting] {
		// Can't delete a running stack
		w.WriteHeader(http.StatusConflict)
		return
	}

	// Delete the running kubernetes service and ingress rule
	for i := range stack.Services {
		stackService := &stack.Services[i]
		stackService.Id = fmt.Sprintf("%s-%s", sid, stackService.Service)
		name := fmt.Sprintf("%s-%s", stack.Id, stackService.Service)
		glog.V(4).Infof("Stopping service %s\n", name)
		spec, _ := s.etcd.GetServiceSpec(userId, stackService.Service)
		if len(spec.Ports) > 0 {
			err := s.kube.StopService(userId, name)
			// Log and continue
			if err != nil {
				glog.Error(err)
			}
		}
		if s.useLoadBalancer() {
			s.kube.DeleteIngress(userId, stackService.Id+"-ingress")
			glog.V(4).Infof("Deleted ingress for service %s\n", stackService.Id)
		}
	}

	err = s.etcd.DeleteStack(userId, sid)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (s *Server) startStackService(serviceKey string, userId string, stack *api.Stack, addrPortMap *map[string]kube.ServiceAddrPort) {

	service, _ := s.etcd.GetServiceSpec(userId, serviceKey)
	for _, dep := range service.Dependencies {
		if dep.Required {
			glog.V(4).Infof("Starting required dependency %s\n", dep.DependencyKey)
			s.startController(userId, dep.DependencyKey, stack, addrPortMap)
		} else {
			s.startStackService(dep.DependencyKey, userId, stack, addrPortMap)
		}
	}
}

func (s *Server) startController(userId string, serviceKey string, stack *api.Stack, addrPortMap *map[string]kube.ServiceAddrPort) (bool, error) {

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

	pods, _ := s.kube.GetPods(userId, "name", fmt.Sprintf("%s-%s", stack.Id, serviceKey))
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
	spec, _ := s.etcd.GetServiceSpec(userId, serviceKey)

	// If useFrom is set on *this* spec,
	for _, config := range spec.Config {
		if len(config.UseFrom) > 0 {
			for i := range stack.Services {
				ss := &stack.Services[i]
				useFrom := strings.Split(config.UseFrom, ".")
				if useFrom[0] == ss.Service {
					glog.V(4).Infof("Setting %s %s to %s %s\n", stackService.Id, config.Name, ss.Id, ss.Config[config.Name])
					stackService.Config[config.Name] = ss.Config[useFrom[1]]
				}
			}
		}
	}

	// Enumerate other services in this stack to see if "setTo" is set
	// on any configs for this service.
	if stackService.Config == nil {
		stackService.Config = map[string]string{}
	}
	for _, ss := range stack.Services {
		ssSpec, _ := s.etcd.GetServiceSpec(userId, ss.Service)
		for _, config := range ssSpec.Config {
			if len(config.SetTo) > 0 {
				setTo := strings.Split(config.SetTo, ".")
				// Is the setTo key this service?
				if setTo[0] == serviceKey {
					glog.V(4).Infof("Setting %s.%s to %s.%s value\n", serviceKey, config.Name, ss.Id, setTo[1], ss.Config[setTo[1]])
					stackService.Config[setTo[1]] = ss.Config[config.Name]
				}
			}
		}
	}

	name := fmt.Sprintf("%s-%s", stack.Id, spec.Key)

	account, _ := s.etcd.GetAccount(userId)
	template := s.kube.CreateControllerTemplate(userId, name, stack.Id, s.domain, account.EmailAddress, stackService, spec, addrPortMap)

	s.makeDirectories(userId, stackService)

	k8vols := make([]k8api.Volume, 0)

	// Mount the home directory
	k8homeVol := k8api.Volume{}
	k8homeVol.Name = "home"
	k8homeHostPath := k8api.HostPathVolumeSource{}
	k8homeHostPath.Path = s.volDir + "/" + userId
	k8homeVol.HostPath = &k8homeHostPath
	k8vols = append(k8vols, k8homeVol)

	if len(stackService.VolumeMounts) > 0 || len(spec.VolumeMounts) > 0 {

		idx := 0
		for fromPath, toPath := range stackService.VolumeMounts {

			k8vol := k8api.Volume{}
			k8hostPath := k8api.HostPathVolumeSource{}
			found := false
			for i, mount := range spec.VolumeMounts {
				if mount.MountPath == toPath {
					k8vol.Name = fmt.Sprintf("vol%d", i)
					k8hostPath.Path = s.volDir + "/" + userId + "/" + fromPath
					found = true
				}
			}

			if !found {
				// Create any user-specified mounts
				volName := fmt.Sprintf("user%d", idx)
				glog.V(4).Infof("Creating user mount %s\n", volName)
				k8vol.Name = volName
				k8vm := k8api.VolumeMount{Name: volName, MountPath: toPath}
				if len(template.Spec.Template.Spec.Containers[0].VolumeMounts) == 0 {
					template.Spec.Template.Spec.Containers[0].VolumeMounts = []k8api.VolumeMount{}
				}
				template.Spec.Template.Spec.Containers[0].VolumeMounts = append(template.Spec.Template.Spec.Containers[0].VolumeMounts, k8vm)
				k8hostPath.Path = s.volDir + "/" + userId + "/" + fromPath
				idx++
			}
			k8vol.HostPath = &k8hostPath
			k8vols = append(k8vols, k8vol)
		}

		if len(spec.VolumeMounts) > 0 {
			// Go back through the spec volume mounts and create emptyDirs where needed
			for _, mount := range spec.VolumeMounts {
				k8vol := k8api.Volume{}

				glog.V(4).Infof("Need volume for %s \n", stackService.Service)
				if mount.Type == api.MountTypeDocker {
					// TODO: Need to prevent non-NDS services from mounting the Docker socket
					k8vol := k8api.Volume{}
					k8vol.Name = "docker"
					k8hostPath := k8api.HostPathVolumeSource{}
					k8hostPath.Path = "/var/run/docker.sock"
					k8vol.HostPath = &k8hostPath
					k8vols = append(k8vols, k8vol)
				} else {
					found := false
					for _, toPath := range stackService.VolumeMounts {
						if toPath == mount.MountPath {
							found = true
						}
					}

					if !found {
						glog.Warningf("Required volume not found, using emptyDir\n")
						k8empty := k8api.EmptyDirVolumeSource{}
						k8vol.Name = fmt.Sprintf("empty%d", idx)
						k8vol.EmptyDir = &k8empty
						k8vols = append(k8vols, k8vol)
					}
				}
			}
		}
	}
	template.Spec.Template.Spec.Volumes = k8vols

	glog.V(4).Infof("Starting controller %s\n", name)
	_, err := s.kube.StartController(userId, template)
	if err != nil {
		stackService.Status = "error"
		stackService.StatusMessages = append(stackService.StatusMessages,
			fmt.Sprintf("Error starting stack service: %s\n", err))
		return false, err
	}

	// Give Kubernetes time to create the pods for the RC
	time.Sleep(time.Second * 3)

	// Wait for stack service to be in ready state
	ready := 0
	failed := 0

	timeOut := defaultTimeout
	if spec.ReadyProbe.Timeout > 0 {
		timeOut = int(spec.ReadyProbe.Timeout)
	}
	timeWait := time.Second * 0
	for (ready + failed) < len(stack.Services) {
		stck, _ := s.etcd.GetStack(userId, stack.Id)
		for _, ss := range stck.Services {
			glog.V(4).Infof("Stack service %s: status=%s\n", ss.Id, ss.Status)
			if ss.Status == "ready" {
				ready++
			} else if ss.Status == "error" {
				failed++
			}
		}

		if timeWait > time.Duration(timeOut)*time.Second {
			stackService.StatusMessages = append(stackService.StatusMessages,
				fmt.Sprintf("Service timed out after %d seconds\n", timeOut))
			stackService.Status = "timeout"

			// Update stack status
			s.etcd.PutStack(userId, stack.Id, stack)

			// Service has taken too long to startup
			glog.V(4).Infof("Stack service %s reached timeout, stopping\n", stackService.Id)
			err := s.kube.StopController(userId, stackService.Id)
			if err != nil {
				glog.Error(err)
			}

			failed++
			break
		}
		time.Sleep(time.Second * 3)
		timeWait += time.Second * 3
	}

	if failed > 0 {
		return false, nil
	} else {
		return true, nil
	}
}

func (s *Server) StartStack(w rest.ResponseWriter, r *rest.Request) {
	userId := s.getUser(r)
	sid := r.PathParam("sid")

	stack, _ := s.etcd.GetStack(userId, sid)
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

	stack, err := s.startStack(userId, stack)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteJson(&stack)
}

func (s *Server) startStack(userId string, stack *api.Stack) (*api.Stack, error) {

	sid := stack.Id
	stack.Status = stackStatus[Starting]
	s.etcd.PutStack(userId, sid, stack)

	stackServices := stack.Services

	// Get the service/port mappinggs
	addrPortMap := make(map[string]kube.ServiceAddrPort)
	for _, stackService := range stackServices {
		spec, _ := s.etcd.GetServiceSpec(userId, stackService.Service)
		name := fmt.Sprintf("%s-%s", stack.Id, spec.Key)
		svc, _ := s.kube.GetService(userId, name)
		if svc != nil {
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
	errors := map[string]int{}
	glog.V(4).Infof("Starting services for %s %s\n", userId, sid)
	for len(started) < len(stackServices) {
		if len(errors) > 0 {
			// Dependent service is in error, abort
			glog.V(4).Infof("Aborting startup due to error\n")
			break
		}

		stack, _ = s.getStackWithStatus(userId, sid)
		for _, stackService := range stack.Services {
			if stackService.Status == "error" {
				errors[stackService.Service] = 1
				break
			}

			if started[stackService.Service] == 1 {
				continue
			}
			svc, _ := s.etcd.GetServiceSpec(userId, stackService.Service)

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
				go s.startController(userId, stackService.Service, stack, &addrPortMap)
				started[stackService.Service] = 1
			}
		}
		time.Sleep(time.Second * 3)
	}

	ready := map[string]int{}
	for len(ready) < len(started) && len(errors) == 0 {
		stack, _ = s.getStackWithStatus(userId, sid)
		for _, stackService := range stack.Services {
			if stackService.Status == "ready" {
				ready[stackService.Service] = 1
			}
			if stackService.Status == "error" || stackService.Status == "timeout" {
				errors[stackService.Service] = 1
			}
		}
		time.Sleep(time.Second * 3)
	}

	stack, _ = s.getStackWithStatus(userId, sid)
	stack.Status = "started"
	for _, stackService := range stack.Services {
		if stackService.Status == "error" || stackService.Status == "timeout" {
			stack.Status = "error"
		}
	}

	glog.V(4).Infof("Stack %s started\n", sid)
	s.etcd.PutStack(userId, sid, stack)

	return stack, nil
}

func (s *Server) makeDirectories(userId string, stackService *api.StackService) {
	for path, _ := range stackService.VolumeMounts {
		os.MkdirAll(s.volDir+"/"+userId+"/"+path, 0777|os.ModeSticky)
	}
}

func (s *Server) getStackWithStatus(userId string, sid string) (*api.Stack, error) {

	stack, _ := s.etcd.GetStack(userId, sid)
	if stack == nil {
		return nil, nil
	}

	for i := range stack.Services {
		stackService := &stack.Services[i]
		stackService.Endpoints = []api.Endpoint{}

		k8service, _ := s.kube.GetService(userId, stackService.Id)
		if k8service == nil {
			continue
		}

		glog.V(4).Infof("Stack service %s: status=%s\n", stackService.Id, stackService.Status)

		// Get the port protocol for the service endpoint
		spec, err := s.etcd.GetServiceSpec(userId, stackService.Service)
		if err != nil {
			glog.Error(err)
		}

		stackService.InternalIP = k8service.Spec.ClusterIP
		for _, specPort := range spec.Ports {
			for _, k8port := range k8service.Spec.Ports {
				if specPort.Port == k8port.Port {
					endpoint := api.Endpoint{}
					endpoint.Port = specPort.Port
					endpoint.Protocol = specPort.Protocol
					endpoint.NodePort = k8port.NodePort
					if s.useLoadBalancer() && spec.Access == api.AccessExternal {
						endpoint.Host = fmt.Sprintf("%s.%s", stackService.Id, s.domain)
						endpoint.Path = specPort.ContextPath
						endpoint.URL = endpoint.Host + specPort.ContextPath
					}

					stackService.Endpoints = append(stackService.Endpoints, endpoint)
				}
			}

		}
	}

	return stack, nil
}

func (s *Server) StopStack(w rest.ResponseWriter, r *rest.Request) {
	userId := s.getUser(r)
	sid := r.PathParam("sid")

	stack, err := s.etcd.GetStack(userId, sid)
	if stack == nil {
		rest.NotFound(w, r)
		return
	}
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	stack, err = s.stopStack(userId, sid)
	if err == nil {
		glog.V(4).Infof("Stack %s stopped \n", sid)
		w.WriteJson(&stack)
	} else {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
	}

}

func (s *Server) stopStack(userId string, sid string) (*api.Stack, error) {

	path := "/accounts/" + userId + "/stacks/" + sid
	glog.V(4).Infof("Stopping stack %s\n", path)

	stack, _ := s.etcd.GetStack(userId, sid)

	glog.V(4).Infof("Stack status %s\n", stack.Status)
	if stack.Status == stackStatus[Stopped] {
		// Can't stop a stopped service
		glog.V(4).Infof("Can't stop a stopped service")
		return stack, nil
	}

	stack.Status = stackStatus[Stopping]
	s.etcd.PutStack(userId, sid, stack)

	// For each stack service, stop dependent services first.
	stopped := map[string]int{}

	for len(stopped) < len(stack.Services) {
		stack, _ = s.getStackWithStatus(userId, sid)
		for _, stackService := range stack.Services {
			spec, _ := s.etcd.GetServiceSpec(userId, stackService.Service)
			name := fmt.Sprintf("%s-%s", stack.Id, spec.Key)
			if stopped[stackService.Service] == 1 {
				continue
			}

			glog.V(4).Infof("Stopping service %s\n", stackService.Service)

			numDeps := 0
			stoppedDeps := 0
			for _, ss := range stack.Services {
				svc, _ := s.etcd.GetServiceSpec(userId, ss.Service)
				for _, dep := range svc.Dependencies {
					if dep.DependencyKey == stackService.Service {
						numDeps++
						if ss.Status == "stopped" || ss.Status == "" || ss.Status == "error" {
							stoppedDeps++
						}
					}
				}
			}
			if numDeps == 0 || stoppedDeps == numDeps {
				stopped[stackService.Service] = 1

				glog.V(4).Infof("Stopping controller %s\n", name)
				err := s.kube.StopController(userId, name)
				if err != nil {
					glog.Error(err)
				}
			}
		}
		time.Sleep(time.Second * 3)
	}

	podStatus := make(map[string]string)
	pods, _ := s.kube.GetPods(userId, "stack", stack.Id)
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
		stackService.StatusMessages = []string{}
		stackService.Endpoints = nil
	}

	stack.Status = stackStatus[Stopped]
	s.etcd.PutStack(userId, sid, stack)

	stack, _ = s.getStackWithStatus(userId, sid)
	return stack, nil
}

func (s *Server) GetLogs(w rest.ResponseWriter, r *rest.Request) {
	userId := s.getUser(r)
	ssid := r.PathParam("ssid")
	lines := r.Request.FormValue("lines")

	if !s.stackServiceExists(userId, ssid) {
		rest.Error(w, "No such service", http.StatusNotFound)
		return
	}

	tailLines, err := strconv.Atoi(lines)

	sid := ssid[0:strings.LastIndex(ssid, "-")]
	logs, err := s.getLogs(userId, sid, ssid, tailLines)

	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	} else {
		w.WriteJson(&logs)
	}
}

func (s *Server) GetConfigs(w rest.ResponseWriter, r *rest.Request) {
	userId := s.getUser(r)
	services := r.Request.FormValue("services")

	sids := strings.Split(services, ",")

	configs := make(map[string][]api.Config)
	for _, sid := range sids {
		if !s.serviceExists(userId, sid) {
			rest.Error(w, "No such service", http.StatusNotFound)
			return
		}
		spec, err := s.etcd.GetServiceSpec(userId, sid)
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

func (s *Server) getLogs(userId string, sid string, ssid string, tailLines int) (string, error) {

	glog.V(4).Infof("Getting logs for %s %s %d", sid, ssid, tailLines)

	stack, err := s.etcd.GetStack(userId, sid)
	if err != nil {
		return "", err
	}

	pods, err := s.kube.GetPods(userId, "stack", stack.Id)
	if err != nil {
		return "", err
	}

	log := ""
	for _, ss := range stack.Services {
		if ss.Id == ssid {

			log += fmt.Sprintf("KUBERNETES LOG\n=====================\n")
			for _, msg := range ss.StatusMessages {
				log += msg + "\n"
			}

			log += fmt.Sprintf("\nSERVICE LOG\n=====================\n")
			for _, pod := range pods {
				if pod.Labels["name"] == ssid {
					podLog, err := s.kube.GetLog(userId, pod.Name, tailLines)
					if err != nil {
						return "", err
					} else {
						log += podLog
					}
				}
			}
		}
	}
	return log, nil
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
	s.etcd.PutGlobalService(service.Key, &service)
	return nil
}

func (s *Server) loadSpecs(path string) error {
	files, err := ioutil.ReadDir(path)
	if err != nil {
		return err
	}

	for _, file := range files {
		if file.IsDir() {
			if file.Name() != "vocab" && file.Name() != "schemas" {
				s.loadSpecs(fmt.Sprintf("%s/%s", path, file.Name()))
			}
		} else {
			s.addServiceFile(fmt.Sprintf("%s/%s", path, file.Name()))
		}
	}

	return nil
}

func (s *Server) HandlePodEvent(eventType watch.EventType, event *k8api.Event, pod *k8api.Pod) {

	if pod.Namespace != "default" && pod.Namespace != systemNamespace {
		glog.V(4).Infof("HandlePodEvent %s", eventType)

		//name := pod.Name
		userId := pod.Namespace
		sid := pod.ObjectMeta.Labels["stack"]
		ssid := pod.ObjectMeta.Labels["name"]
		//phase := pod.Status.Phase

		if len(sid) > 0 {

			// Get stack service from Pod name
			stack, err := s.etcd.GetStack(userId, sid)
			if err != nil {
				glog.Errorf("Error getting stack: %s\n", err)
				return
			}

			var stackService *api.StackService
			for i := range stack.Services {
				if stack.Services[i].Id == ssid {
					stackService = &stack.Services[i]
				}
			}

			if event != nil {
				// This is a general Event
				if event.Reason == "MissingClusterDNS" {
					// Ignore these for now
					return
				}
				if event.Type == "Warning" &&
					(event.Reason != "Unhealthy" || event.Reason == "FailedSync" ||
						event.Reason == "BackOff") {
					// This is an error
					stackService.Status = "error"
				}

				stackService.StatusMessages = append(stackService.StatusMessages,
					fmt.Sprintf("Reason=%s, Message=%s", event.Reason, event.Message))
			} else {
				// This is a Pod event
				ready := false
				if len(pod.Status.Conditions) > 0 {
					if pod.Status.Conditions[0].Type == "Ready" {
						ready = (pod.Status.Conditions[0].Status == "True")
					}

					if len(pod.Status.ContainerStatuses) > 0 {
						// The pod was terminated, this is an error
						if pod.Status.ContainerStatuses[0].State.Terminated != nil {
							reason := pod.Status.ContainerStatuses[0].State.Terminated.Reason
							message := pod.Status.ContainerStatuses[0].State.Terminated.Message
							stackService.Status = "error"
							stackService.StatusMessages = append(stackService.StatusMessages,
								fmt.Sprintf("Reason=%s, Message=%s", reason, message))
						}
					} else {
						reason := pod.Status.Conditions[0].Reason
						message := pod.Status.Conditions[0].Message
						stackService.StatusMessages = append(stackService.StatusMessages,
							fmt.Sprintf("Reason=%s, Message=%s", reason, message))
					}

				}

				if ready {
					stackService.Status = "ready"
				} else {
					if eventType == "ADDED" {
						stackService.Status = "starting"
					} else if eventType == "DELETED" {
						if stackService.Status == "timeout" {
							stackService.Status = "error"
						} else {
							stackService.Status = "stopped"
						}
					}
				}
			}
			message := ""
			if len(stackService.StatusMessages) > 0 {
				message = stackService.StatusMessages[len(stackService.StatusMessages)-1]
			}
			glog.V(4).Infof("Namespace: %s, Pod: %s, Status: %s, StatusMessage: %s\n", userId, pod.Name,
				stackService.Status, message)

			s.etcd.PutStack(userId, sid, stack)
		}
	}
}

func (s *Server) HandleReplicationControllerEvent(eventType watch.EventType, event *k8api.Event,
	rc *k8api.ReplicationController) {

	if rc.Namespace != "default" && rc.Namespace != systemNamespace {
		glog.V(4).Infof("HandleReplicationControllerEvent %s", eventType)

		userId := rc.Namespace
		sid := rc.ObjectMeta.Labels["stack"]
		ssid := rc.ObjectMeta.Labels["name"]

		// Get stack service from Pod name
		stack, err := s.etcd.GetStack(userId, sid)
		if err != nil {
			glog.Errorf("Error getting stack: %s\n", err)
			return
		}

		var stackService *api.StackService
		for i := range stack.Services {
			if stack.Services[i].Id == ssid {
				stackService = &stack.Services[i]
			}
		}

		if event != nil {
			if event.Type == "Warning" {
				// This is an error
				stackService.Status = "error"
			}

			stackService.StatusMessages = append(stackService.StatusMessages,
				fmt.Sprintf("Reason=%s, Message=%s", event.Reason, event.Message))

			glog.V(4).Infof("Namespace: %s, ReplicationController: %s, Status: %s, StatusMessage: %s\n", userId, rc.Name,
				stackService.Status, stackService.StatusMessages[len(stackService.StatusMessages)-1])
		}
		s.etcd.PutStack(userId, sid, stack)
	}
}

func (s *Server) addVocabulary(path string) error {
	if path[len(path)-4:len(path)] != "json" {
		return nil
	}
	glog.V(4).Infof("Adding vocabulary %s", path)
	vocab := api.Vocabulary{}
	data, err := ioutil.ReadFile(path)
	if err != nil {
		fmt.Println(err)
		return err
	}
	err = json.Unmarshal(data, &vocab)
	if err != nil {
		fmt.Println(err)
		return err
	}
	s.etcd.PutVocabulary(vocab.Name, &vocab)
	return nil
}

func (s *Server) GetVocabulary(w rest.ResponseWriter, r *rest.Request) {
	name := r.PathParam("name")
	vocab, err := s.etcd.GetVocabulary(name)
	if err != nil {
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	} else {
		w.WriteJson(&vocab)
	}
}

func (s *Server) useNodePort() bool {
	return s.ingress == IngressTypeNodePort
}

func (s *Server) useLoadBalancer() bool {
	return s.ingress == IngressTypeLoadBalancer
}

func (s *Server) ChangePassword(w rest.ResponseWriter, r *rest.Request) {
	userId := s.getUser(r)

	data := make(map[string]string)
	err := r.DecodeJsonPayload(&data)
	ok, err := s.etcd.ChangePassword(userId, data["password"])
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
	}

	if ok {
		err = s.createBasicAuthSecret(userId)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
	w.WriteHeader(http.StatusOK)
}

func (s *Server) ResetPassword(w rest.ResponseWriter, r *rest.Request) {
	userId := r.PathParam("userId")

	token, err := s.getTemporaryToken(userId)
	if err != nil {
		glog.Error(err)
		w.WriteHeader(http.StatusOK)
		return
	}
	account, err := s.etcd.GetAccount(userId)
	if err != nil {
		glog.Error(err)
		w.WriteHeader(http.StatusOK)
		return
	}

	if account.Status == api.AccountStatusUnverified {
		verifyUrl := s.origin + "/#/?t=" + account.Token + "&u=" + account.Namespace
		err = s.email.SendVerificationEmail(account.Name, account.EmailAddress, verifyUrl)
	} else {
		resetUrl := s.origin + "/#/recover?t=" + token
		err = s.email.SendRecoveryEmail(account.Name, account.EmailAddress, resetUrl, (account.Status == api.AccountStatusUnapproved))
	}

	if err != nil {
		glog.Error(err)
		w.WriteHeader(http.StatusOK)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (s *Server) getTemporaryToken(userId string) (string, error) {

	token := jwtbase.New(jwtbase.GetSigningMethod(s.jwt.SigningAlgorithm))

	if s.jwt.PayloadFunc != nil {
		for key, value := range s.jwt.PayloadFunc(userId) {
			token.Claims[key] = value
		}
	}

	token.Claims["id"] = userId
	token.Claims["exp"] = time.Now().Add(time.Minute * 30).Unix()
	tokenString, err := token.SignedString(s.jwt.Key)
	if err != nil {
		return "", err
	}
	return tokenString, nil

}

func (s *Server) createAdminUser(password string) error {

	glog.V(4).Infof("Creating admin user")

	if !s.accountExists(adminUser) {
		account := &api.Account{
			Name:        adminUser,
			Namespace:   adminUser,
			Description: "NDS Labs administrator",
			Password:    password,
			ResourceLimits: api.AccountResourceLimits{
				CPUMax:        s.cpuMax,
				CPUDefault:    s.cpuDefault,
				MemoryMax:     s.memMax,
				MemoryDefault: s.memDefault,
				StorageQuota:  s.storageDefault,
			},
		}
		err := s.etcd.PutAccount(adminUser, account, true)
		if err != nil {
			glog.Error(err)
			return err
		}
		err = s.setupAccount(account)
		if err != nil {
			glog.Error(err)
			return err
		}

	} else {
		account, err := s.etcd.GetAccount(adminUser)
		if err != nil {
			glog.Error(err)
			return err
		}
		account.Password = password
		err = s.etcd.PutAccount(adminUser, account, true)
		if err != nil {
			glog.Error(err)
			return err
		}
	}
	err := s.createLMABasicAuthSecret()
	if err != nil {
		glog.Error(err)
		return err
	}

	return nil
}

func (s *Server) DownloadClient(w http.ResponseWriter, r *http.Request) {
	ops := r.URL.Query().Get("os")
	if ops != "darwin" && ops != "linux" {
		html := "<html><body>" +
			"<a href=\"download?os=darwin\">ndslabsctl-darwin-amd64</a><br/>" +
			"<a href=\"download?os=linux\">ndslabsctl-linux-amd64</a><br/>" +
			"</body></html>"
		w.Write([]byte(html))
	} else {
		w.Header().Set("Content-Disposition", "attachment; filename=ndslabsctl")
		w.Header().Set("Content-Type", r.Header.Get("Content-Type"))

		reader, err := os.Open("/ndslabsctl/ndslabsctl-" + ops + "-amd64")
		if err != nil {
			glog.Error(err)
			return
		}

		defer reader.Close()
		io.Copy(w, reader)
	}
}

func (s *Server) PostSupport(w rest.ResponseWriter, r *rest.Request) {
	userId := s.getUser(r)

	request := api.SupportRequest{}
	err := r.DecodeJsonPayload(&request)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	account, err := s.etcd.GetAccount(userId)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = s.email.SendSupportEmail(account.Name, account.EmailAddress, string(request.Type), request.Message, request.Anonymous)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	return

}

func (s *Server) GetContact(w rest.ResponseWriter, r *rest.Request) {
	w.WriteJson(map[string]string{
		"email": s.email.SupportEmail,
		"forum": "https://groups.google.com/forum/#!forum/ndslabs",
		"chat":  "https://gitter.im/nds-org/ndslabs",
	})
}

func (s *Server) getAppDataDir(stackService string) string {
	return fmt.Sprintf("%s-%s", stackService, s.kube.RandomString(5))
}

func (s *Server) checkDependencies(uid string, service *api.ServiceSpec) (string, bool) {
	for _, dependency := range service.Dependencies {
		if !s.serviceExists(uid, dependency.DependencyKey) {
			return dependency.DependencyKey, false
		}
	}
	return "", true
}

// Make sure that conig.useFrom dependencies exist
func (s *Server) checkConfigs(uid string, service *api.ServiceSpec) (string, bool) {
	for _, config := range service.Config {
		if len(config.UseFrom) > 0 {
			useFrom := strings.Split(config.UseFrom, ".")
			if !s.serviceExists(uid, useFrom[0]) {
				return useFrom[0], false
			}
		}

		if len(config.SetTo) > 0 {
			setTo := strings.Split(config.SetTo, ".")
			if !s.serviceExists(uid, setTo[0]) {
				return setTo[0], false
			}
		}
	}
	return "", true
}

func (s *Server) GetHealthz(w rest.ResponseWriter, r *rest.Request) {
	// Confirm access to Etcd
	_, err := s.etcd.GetAccount(adminUser)
	if err != nil {
		rest.Error(w, "etcd not available", http.StatusInternalServerError)
		return
	}

	// Confirm access to Kubernetes API
	_, err = s.kube.GetNamespace(adminUser)
	if err != nil {
		rest.Error(w, "Kubernetes API not available", http.StatusInternalServerError)
		return
	}

	// Confirm access to Gluster and GFS
	_, err = s.getGlusterStatus()
	if err != nil {
		rest.Error(w, "GFS not available", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
