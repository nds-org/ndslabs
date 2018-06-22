// Copyright © 2016 National Data Service
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	config "github.com/ndslabs/apiserver/pkg/config"
	email "github.com/ndslabs/apiserver/pkg/email"
	etcd "github.com/ndslabs/apiserver/pkg/etcd"
	kube "github.com/ndslabs/apiserver/pkg/kube"
	mw "github.com/ndslabs/apiserver/pkg/middleware"
	api "github.com/ndslabs/apiserver/pkg/types"
	validate "github.com/ndslabs/apiserver/pkg/validate"
	version "github.com/ndslabs/apiserver/pkg/version"
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
	Config          *config.Config
	etcd            *etcd.EtcdHelper
	kube            *kube.KubeHelper
	Validator       *validate.Validator
	email           *email.EmailHelper
	Namespace       string
	local           bool
	homeVolume      string
	hostname        string
	jwt             *jwt.JWTMiddleware
	prefix          string
	ingress         config.IngressType
	domain          string
	requireApproval bool
	origin          string
}

var defaultTimeout = 600

func main() {

	var confPath, adminPasswd string
	flag.StringVar(&confPath, "conf", "apiserver.json", "Configuration path")
	flag.StringVar(&adminPasswd, "passwd", "admin", "Admin user password")
	flag.Parse()
	cfg, err := readConfig(confPath)
	if err != nil {
		glog.Error(err)
		os.Exit(-1)
	}

	if cfg.Port == "" {
		cfg.Port = "30001"
	}
	if cfg.Etcd.Address == "" {
		cfg.Etcd.Address = "localhost:4001"
	}
	if cfg.Etcd.MaxMessages <= 0 {
		cfg.Etcd.MaxMessages = 100
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
	if cfg.DefaultLimits.InactiveTimeout <= 0 {
		cfg.DefaultLimits.InactiveTimeout = 8 * 60 // minutes
	}

	hostname, err := os.Hostname()
	if err != nil {
		glog.Fatal(err)
	}

	glog.Infof("Connecting to etcd on %s\n", cfg.Etcd.Address)
	etcd, err := etcd.NewEtcdHelper(cfg.Etcd.Address, cfg.Etcd.MaxMessages)
	if err != nil {
		glog.Errorf("Etcd not available: %s\n", err)
		glog.Fatal(err)
	}
	glog.Infof("Connected to etcd\n")

	glog.Infof("Connecting to Kubernetes API %s\n", cfg.Kubernetes.Address)
	kube, err := kube.NewKubeHelper(cfg.Kubernetes.Address,
		cfg.Kubernetes.Username, cfg.Kubernetes.Password, cfg.Kubernetes.TokenPath,
		cfg.AuthSignInURL, cfg.AuthURL)
	if err != nil {
		glog.Errorf("Kubernetes API server not available\n")
		glog.Fatal(err)
	}
	glog.Infof("Connected to Kubernetes\n")

	email, err := email.NewEmailHelper(cfg.Email.Host, cfg.Email.Port, cfg.Email.TLS, cfg.Support.Email, cfg.Origin, cfg.Name)
	if err != nil {
		glog.Errorf("Error in email server configuration\n")
		glog.Fatal(err)
	}

	server := Server{}
	server.hostname = hostname
	if cfg.Ingress == config.IngressTypeLoadBalancer {
		if len(cfg.Domain) > 0 {
			server.domain = cfg.Domain
		} else {
			glog.Error("Domain must be specified for ingress type LoadBalancer")
		}
	}
	server.etcd = etcd
	server.kube = kube
	server.email = email
	server.Config = cfg
	server.homeVolume = cfg.HomeVolume
	server.requireApproval = cfg.RequireApproval

	server.ingress = config.IngressTypeNodePort
	if cfg.Ingress != "" {
		server.ingress = cfg.Ingress
	}

	server.prefix = "/api/"
	if cfg.Prefix != "" {
		server.prefix = cfg.Prefix
	}
	server.start(cfg, adminPasswd)

}

func (s *Server) start(cfg *config.Config, adminPasswd string) {

	glog.Infof("Starting Workbench API server (%s %s)", version.VERSION, version.BUILD_DATE)
	glog.Infof("Using etcd %s ", cfg.Etcd.Address)
	glog.Infof("Using kube-apiserver %s", cfg.Kubernetes.Address)
	glog.Infof("Using ome volume %s", cfg.HomeVolume)
	glog.Infof("Using specs dir %s", cfg.Specs.Path)
	glog.Infof("Listening on port %s", cfg.Port)

	homeVol := s.getHomeVolume()
	os.MkdirAll(homeVol.Path, 0777)

	api := rest.NewApi()
	api.Use(rest.DefaultDevStack...)
	api.Use(&mw.NoCacheMiddleware{})

	glog.Infof("prefix %s", s.prefix)

	if len(cfg.Origin) > 0 {
		glog.Infof("CORS origin %s\n", cfg.Origin)
		s.origin = cfg.Origin

		api.Use(&rest.CorsMiddleware{
			RejectNonCorsRequests: false,
			OriginValidator: func(origin string, request *rest.Request) bool {
				// NDS-552
				return origin == cfg.Origin || origin == cfg.Origin+"."
			},
			AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},
			AllowedHeaders: []string{
				"Accept", "Content-Type", "X-Custom-Header", "Origin", "accept", "authorization"},
			AccessControlAllowCredentials: true,
			AccessControlMaxAge:           3600,
		})
	}

	timeout := time.Minute * 30
	if cfg.Timeout > 0 {
		timeout = time.Minute * time.Duration(cfg.Timeout)
	}
	glog.Infof("session timeout %s", timeout)

	glog.Infof("domain %s", cfg.Domain)
	glog.Infof("ingress %s", cfg.Ingress)

	jwt := &jwt.JWTMiddleware{
		Key:        []byte(adminPasswd),
		Realm:      "ndslabs",
		Timeout:    timeout,
		MaxRefresh: time.Hour * 24,
		Authenticator: func(userId string, password string) bool {
			if userId == adminUser && password == adminPasswd {
				return true
			} else {
				if strings.Contains(userId, "@") {
					account := s.getAccountByEmail(userId)
					if account != nil {
						userId = account.Namespace
					}
				}
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

			if strings.Contains(userId, "@") {
				account := s.getAccountByEmail(userId)
				if account != nil {
					userId = account.Namespace
				}
			}

			payload["server"] = s.hostname
			payload["user"] = userId
			account, err := s.etcd.GetAccount(userId)
			if err == nil {
				account.LastLogin = time.Now().Unix()
				s.etcd.PutAccount(account.Namespace, account, false)
			}
			return payload
		},
	}
	s.jwt = jwt

	api.Use(&rest.IfMiddleware{
		Condition: func(request *rest.Request) bool {
			glog.Infof("remoteAddr: %s", request.Request.RemoteAddr)

			return strings.HasPrefix(request.URL.Path, s.prefix+"accounts") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"change_password") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"check_token") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"check_console") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"configs") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"export") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"import") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"log_level") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"logs") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"mount") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"refresh_token") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"services") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"shutdown") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"stacks") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"start") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"stop") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"support") ||
				strings.HasPrefix(request.URL.Path, s.prefix+"volumes")
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
		rest.Post(s.prefix+"reset", s.ResetPassword),
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
		rest.Get(s.prefix+"start", s.QuickstartStack),
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
		rest.Post(s.prefix+"import/:userId", s.ImportAccount),
		rest.Get(s.prefix+"export/:userId", s.ExportAccount),
		rest.Get(s.prefix+"stop_all", s.StopAllStacks),
		rest.Put(s.prefix+"log_level/:level", s.PutLogLevel),
		rest.Get(s.prefix+"download", s.DownloadClient),
	)

	router, err := rest.MakeRouter(routes...)

	if err != nil {
		glog.Fatal(err)
	}
	api.SetApp(router)

	if len(cfg.Specs.Path) > 0 {
		glog.Infof("Loading service specs from %s\n", cfg.Specs.Path)
		err = s.loadSpecs(cfg.Specs.Path)
		if err != nil {
			glog.Warningf("Error loading specs: %s\n", err)
		}
		s.addVocabulary(cfg.Specs.Path + "/vocab/tags.json")
		s.Validator = validate.NewValidator(cfg.Specs.Path + "/schemas/spec-schema.json")
	}

	s.createAdminUser(adminPasswd)
	go s.initExistingAccounts()

	go s.kube.WatchEvents(s)
	go s.kube.WatchPods(s)
	go s.shutdownInactiveServices()

	// primary rest api server
	httpsrv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: api.MakeHandler(),
	}
	glog.Infof("Listening on %s", cfg.Port)

	// internal admin server, currently only handling oauth registration
	adminsrv := &http.Server{
		Addr:    ":" + cfg.AdminPort,
		Handler: http.HandlerFunc(s.RegisterUserOauth),
	}
	glog.Infof("Admin server listening on %s", cfg.AdminPort)

	stop := make(chan os.Signal, 2)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	go func() {
		httpsrv.ListenAndServe()
	}()
	go func() {
		adminsrv.ListenAndServe()
	}()
	<-stop

	// Handle shutdown
	fmt.Println("Shutting down apiserver")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	httpsrv.Shutdown(ctx)
	fmt.Println("Apiserver stopped")
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
		if !s.kube.NamespaceExists(account.Namespace) && account.Status == api.AccountStatusApproved {
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
	paths = append(paths, s.prefix+"log_level")
	paths = append(paths, s.prefix+"logs")
	paths = append(paths, s.prefix+"mount")
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
	// Basic token validation is handled by jwt middleware
	userId := s.getUser(r)
	host := r.Request.FormValue("host")

	// Log last activity for user
	account, err := s.etcd.GetAccount(userId)
	if err == nil {
		account.LastLogin = time.Now().Unix()
		s.etcd.PutAccount(account.Namespace, account, false)
	}

	// If host specified, see if it belongs to this namespace
	if len(host) > 0 {
		ok, err := (s.checkIngress(userId, host))
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
		} else {
			if ok || s.IsAdmin(r) {
				w.WriteHeader(http.StatusOK)
			} else {
				w.WriteHeader(http.StatusForbidden)
			}
		}
	} else {
		w.WriteHeader(http.StatusOK)
	}
}

func (s *Server) Logout(w rest.ResponseWriter, r *rest.Request) {
	w.WriteHeader(http.StatusOK)
}

func (s *Server) GetAllAccounts(w rest.ResponseWriter, r *rest.Request) {

	if !s.IsAdmin(r) {
		rest.Error(w, "", http.StatusForbidden)
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
	if r.Env["JWT_PAYLOAD"] != nil {
		payload := r.Env["JWT_PAYLOAD"].(map[string]interface{})
		if payload[adminUser] == true {
			return ""
		} else {
			return payload["user"].(string)
		}
	}
	return ""
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

	if strings.Contains(userId, "@") {
		account := s.getAccountByEmail(userId)
		if account != nil {
			userId = account.Namespace
		}
	}

	// Check IsAdmin or userId = current user
	if !(s.IsAdmin(r) || s.getUser(r) == userId) {
		rest.Error(w, "", http.StatusForbidden)
		return
	}

	glog.V(4).Infof("Getting account %s\n", userId)
	account, err := s.etcd.GetAccount(userId)
	if err != nil {
		rest.NotFound(w, r)
		return
	} else {
		account.Password = ""
		if !(s.IsAdmin(r)) {
			account.Token = ""
		}
		w.WriteJson(account)
	}
}

func (s *Server) PostAccount(w rest.ResponseWriter, r *rest.Request) {

	if !s.IsAdmin(r) {
		rest.Error(w, "", http.StatusForbidden)
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

	w.WriteJson(&account)
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

		_, err = s.kube.CreateBasicAuthSecret(systemNamespace, adminUser, "", account.Password)
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
			CPUMax:        s.Config.DefaultLimits.CpuMax,
			CPUDefault:    s.Config.DefaultLimits.CpuDefault,
			MemoryMax:     s.Config.DefaultLimits.MemMax,
			MemoryDefault: s.Config.DefaultLimits.MemDefault,
			StorageQuota:  s.Config.DefaultLimits.StorageDefault,
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

	_, err = s.updateStorageQuota(account)
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

	verifyUrl := s.origin + "/landing/?t=" + account.Token + "&u=" + account.Namespace
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

	if account.InactiveTimeout == 0 {
		account.InactiveTimeout = s.Config.DefaultLimits.InactiveTimeout
	}
	glog.Infof("Inactive timeout for %s set to %v\n", account.Namespace, account.InactiveTimeout)

	if s.requireApproval {
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

			approveUrl := s.origin + "/api/register/approve?t=" + account.Token + "&u=" + account.Namespace
			denyUrl := s.origin + "/api/register/deny?t=" + account.Token + "&u=" + account.Namespace
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
	} else {
		account.Status = api.AccountStatusApproved
		err := s.etcd.PutAccount(userId, account, false)
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

		err = s.email.SendStatusEmail(account.Name, account.Namespace, account.EmailAddress, s.origin, account.NextURL, true)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
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

		err = s.email.SendStatusEmail(account.Name, account.Namespace, account.EmailAddress, s.origin, account.NextURL, true)
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
		err = s.email.SendStatusEmail(account.Name, account.Namespace, account.EmailAddress, "", "", false)
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

	homeVol := s.getHomeVolume()
	err := os.MkdirAll(homeVol.Path+"/"+account.Namespace, 0777)
	if err != nil {
		return false, err
	}

	// Get the GFS server pods
	gfs, err := s.kube.GetPods(systemNamespace, "name", glusterPodName)
	if err != nil {
		return false, err
	}
	if len(gfs) > 0 {
		cmd := []string{"gluster", "volume", "quota", homeVol.Name, "limit-usage", "/" + account.Namespace, fmt.Sprintf("%dGB", account.ResourceLimits.StorageQuota)}
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

	homeVol := s.getHomeVolume()
	// Get the GFS server pods
	gfs, err := s.kube.GetPods(systemNamespace, "name", glusterPodName)
	if err != nil {
		return false, err
	}
	if len(gfs) > 0 {
		cmd := []string{"gluster", "volume", "status", homeVol.Name}
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
		rest.Error(w, "", http.StatusForbidden)
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

	w.WriteJson(&account)
}

func (s *Server) DeleteAccount(w rest.ResponseWriter, r *rest.Request) {
	userId := r.PathParam("userId")

	glog.V(4).Infof("DeleteAccount %s", userId)

	// Check IsAdmin or userId = current user
	if !(s.IsAdmin(r) || s.getUser(r) == userId) {
		rest.Error(w, "", http.StatusForbidden)
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

	homeVol := s.getHomeVolume()
	err = os.RemoveAll(homeVol.Path + "/" + userId)
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

	ok, err := s.Validator.ValidateSpec(&service)
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
		return
	}

	cf, ok := s.checkConfigs(userId, &service)
	if !ok {
		glog.Warningf("Cannot add service, config dependency %s missing\n", cf)
		rest.Error(w, fmt.Sprintf("Missing config dependency %s", cf), http.StatusNotFound)
		return
	}

	if catalog == "system" {
		if !s.IsAdmin(r) {
			rest.Error(w, "", http.StatusForbidden)
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

	ok, err := s.Validator.ValidateSpec(&service)
	if !ok {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	dep, ok := s.checkDependencies(userId, &service)
	if !ok {
		glog.Warningf("Cannot add service, dependency %s missing\n", dep)
		rest.Error(w, fmt.Sprintf("Missing dependency %s", dep), http.StatusNotFound)
		return
	}
	cf, ok := s.checkConfigs(userId, &service)
	if !ok {
		glog.Warningf("Cannot add service, config dependency %s missing\n", cf)
		rest.Error(w, fmt.Sprintf("Missing config dependency %s", cf), http.StatusNotFound)
		return
	}

	if catalog == "system" {
		if !s.IsAdmin(r) {
			rest.Error(w, "", http.StatusForbidden)
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
			rest.Error(w, "", http.StatusForbidden)
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

func (s *Server) getStackByServiceId(userId string, sid string) (*api.Stack, error) {

	var stack *api.Stack = nil

	stks, err := s.etcd.GetStacks(userId)
	if err == nil {
		for _, stk := range *stks {
			if stk.Key == sid {
				stack = &stk
				break
			}
		}
	}
	return stack, nil
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

	stack := &api.Stack{}
	err := r.DecodeJsonPayload(stack)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	stack, err = s.addStack(userId, stack)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteJson(&stack)
}

func (s *Server) addStack(userId string, stack *api.Stack) (*api.Stack, error) {

	glog.V(4).Infof("Adding stack %s %s\n", stack.Key, stack.Name)

	_, err := s.etcd.GetServiceSpec(userId, stack.Key)
	if err != nil {
		glog.V(4).Infof("Service %s not found for user %s\n", stack.Key, userId)
		return nil, err
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

					volPath := s.getVolPath(&mount, stackService.Id)
					stackService.VolumeMounts[volPath] = mount.MountPath
				}
			}

			// Start the Kubernetes service and ingress
			if len(spec.Ports) > 0 {
				_, err := s.createKubernetesService(userId, stack, spec)
				if err != nil {
					glog.V(4).Infof("Failed to start service service %s-%s\n", stack.Id, spec.Key)
					continue
				}
			}
		}
	}

	err = s.etcd.PutStack(userId, stack.Id, stack)
	if err != nil {
		glog.Error(err)
		return nil, err
	}
	return stack, nil
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

	_, delErr := s.kube.DeleteIngress(userId, svc.Name+"-ingress")
	if delErr != nil {
		glog.Warning(delErr)
	}
	_, err := s.kube.CreateIngress(userId, s.domain, svc.Name,
		svc.Spec.Ports, stack.Secure)
	if err != nil {
		glog.Errorf("Error creating ingress for %s\n", svc.Name)
		glog.Error(err)
		return err
	}
	glog.V(4).Infof("Started ingress for service %s (secure=%t)\n", svc.Name, stack.Secure)
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

	// If the user deleted an optional service, need to stop the
	// associated Kubernetes service and ingress rule
	for i := range oldStack.Services {
		stackService := &oldStack.Services[i]
		newStackService := newStack.GetStackService(stackService.Id)
		if newStackService == nil {
			// User deleted a service
			name := fmt.Sprintf("%s-%s", sid, stackService.Service)
			glog.V(4).Infof("Stopping service %s\n", name)
			spec, _ := s.etcd.GetServiceSpec(userId, stackService.Service)
			if len(spec.Ports) > 0 {
				err := s.kube.StopService(userId, name)
				if err != nil {
					glog.Error(err)
				}
			}
			_, err := s.kube.DeleteIngress(userId, stackService.Id+"-ingress")
			if err != nil {
				glog.Error(err)
			}
		}
	}

	// If the user added an optional service, need to create the
	// associated Kubernetes service
	for i := range newStack.Services {
		stackService := &newStack.Services[i]

		oldStackService := oldStack.GetStackService(stackService.Id)
		if oldStackService == nil {

			// User added a new service
			stackService.Id = fmt.Sprintf("%s-%s", sid, stackService.Service)
			spec, _ := s.etcd.GetServiceSpec(userId, stackService.Service)
			if spec != nil && len(spec.Ports) > 0 {
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
						volPath := s.getVolPath(&mount, stackService.Id)
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
					volPath := s.getVolPath(&mount, stackService.Id)
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

	s.makeDirectories(userId, stackService)

	k8vols := make([]k8api.Volume, 0)
	extraVols := make([]config.Volume, 0)

	for _, volume := range s.Config.Volumes {
		if volume.Name == s.homeVolume {
			// Mount the home directory
			k8homeVol := k8api.Volume{}
			k8homeVol.Name = "home"
			k8homeVol.HostPath = &k8api.HostPathVolumeSource{
				Path: volume.Path + "/" + userId,
			}
			k8vols = append(k8vols, k8homeVol)
		} else {
			extraVols = append(extraVols, volume)
			k8vol := k8api.Volume{}
			k8vol.Name = volume.Name
			k8vol.HostPath = &k8api.HostPathVolumeSource{
				Path: volume.Path,
			}
			k8vols = append(k8vols, k8vol)
		}
	}

	// Create the controller template
	account, _ := s.etcd.GetAccount(userId)
	template := s.kube.CreateControllerTemplate(userId, name, stack.Id, s.domain, account.EmailAddress, s.email.Server, stackService, spec, addrPortMap, &extraVols)

	homeVol := s.getHomeVolume()
	if len(stackService.VolumeMounts) > 0 || len(spec.VolumeMounts) > 0 {

		idx := 0
		for fromPath, toPath := range stackService.VolumeMounts {

			k8vol := k8api.Volume{}
			k8hostPath := k8api.HostPathVolumeSource{}
			found := false
			for i, mount := range spec.VolumeMounts {
				if mount.MountPath == toPath {
					k8vol.Name = fmt.Sprintf("vol%d", i)
					k8hostPath.Path = homeVol.Path + "/" + userId + "/" + fromPath
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
				k8hostPath.Path = homeVol.Path + "/" + userId + "/" + fromPath
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

func (s *Server) QuickstartStack(w rest.ResponseWriter, r *rest.Request) {
	userId := s.getUser(r)
	sid := r.Request.FormValue("key")

	if len(sid) == 0 {
		rest.Error(w, "You must specify a service key", http.StatusBadRequest)
		return
	}

	if !s.serviceExists(userId, sid) {
		rest.Error(w, "No such service", http.StatusNotFound)
		return
	}

	stack, err := s.getStackByServiceId(userId, sid)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if stack == nil {
		spec, err := s.etcd.GetServiceSpec(userId, sid)
		if err != nil {
			glog.Error(err)
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Restrict to single service specs (i.e., no dependencies)
		if s.hasRequiredDependencies(spec) {
			rest.Error(w, "Cannot quickstart services with required dependencies", http.StatusUnprocessableEntity) // unprocessable
			return
		}

		stack = &api.Stack{
			Key:    sid,
			Name:   spec.Label,
			Secure: true,
		}

		stackService := api.StackService{
			Service: sid,
			ResourceLimits: api.ResourceLimits{
				CPUMax:        spec.ResourceLimits.CPUMax,
				CPUDefault:    spec.ResourceLimits.CPUDefault,
				MemoryMax:     spec.ResourceLimits.MemoryMax,
				MemoryDefault: spec.ResourceLimits.MemoryDefault,
			},
		}

		// Add the default service
		stack.Services = append(stack.Services, stackService)

		stack, err = s.addStack(userId, stack)
		if err != nil {
			rest.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if stack.Status != "starting" && stack.Status != "started" {
		go s.startStack(userId, stack)
	}
	w.WriteJson(stack)
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
	if stack.Status != stackStatus[Stopped] && stack.Status != stackStatus[Starting] {
		// Can't start a stopping or started service
		glog.V(4).Infof("Can't start a service with status %s\n", stack.Status)
		w.WriteHeader(http.StatusConflict)
		return
	}

	go s.startStack(userId, stack)

	w.WriteHeader(http.StatusAccepted)
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

	// To overcome the 503 error on ingress, wait 5 seconds before returning the endpoint
	time.Sleep(time.Second * 5)
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
		homeVol := s.getHomeVolume()
		os.MkdirAll(homeVol.Path+"/"+userId+"/"+path, 0777)
	}
}

func (s *Server) getHomeVolume() *config.Volume {
	for _, vol := range s.Config.Volumes {
		if vol.Name == s.homeVolume {
			return &vol
		}
	}
	return nil
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
						if len(spec.Ports) == 1 {
							endpoint.Host = fmt.Sprintf("%s.%s", stackService.Id, s.domain)
						} else {
							endpoint.Host = fmt.Sprintf("%s-%d.%s", stackService.Id, specPort.Port, s.domain)
						}

						endpoint.Path = specPort.ContextPath
						endpoint.URL = endpoint.Host + specPort.ContextPath
					}

					stackService.Endpoints = append(stackService.Endpoints, endpoint)
				}
			}
		}

		// NDS-1154
		if stackService.ResourceLimits == (api.ResourceLimits{}) {
			stackService.ResourceLimits.CPUMax = spec.ResourceLimits.CPUMax
			stackService.ResourceLimits.MemoryMax = spec.ResourceLimits.MemoryMax
			stackService.ResourceLimits.CPUDefault = spec.ResourceLimits.CPUDefault
			stackService.ResourceLimits.MemoryDefault = spec.ResourceLimits.MemoryDefault
		}
	}

	return stack, nil
}

func (s *Server) StopStack(w rest.ResponseWriter, r *rest.Request) {
	userId := s.getUser(r)

	if s.IsAdmin(r) {
		userId = r.Request.FormValue("userId")
		_, err := s.etcd.GetAccount(userId)
		if err != nil {
			rest.NotFound(w, r)
			return
		}
	}
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

	go s.stopStack(userId, sid)

	w.WriteHeader(http.StatusAccepted)
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

			if stackService == nil {
				glog.Errorf("No such stack service: %s\n", ssid)
				return
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
					for _, condition := range pod.Status.Conditions {
						if condition.Type == "Ready" {
							ready = (condition.Status == "True")
						}
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
	return s.ingress == config.IngressTypeNodePort
}

func (s *Server) useLoadBalancer() bool {
	return s.ingress == config.IngressTypeLoadBalancer
}

func (s *Server) ChangePassword(w rest.ResponseWriter, r *rest.Request) {
	userId := s.getUser(r)

	data := make(map[string]string)
	err := r.DecodeJsonPayload(&data)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
	}

	_, err = s.etcd.ChangePassword(userId, data["password"])
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.WriteHeader(http.StatusOK)
}

func (s *Server) ResetPassword(w rest.ResponseWriter, r *rest.Request) {
	userId := r.PathParam("userId")
	if len(userId) == 0 {
		userId = r.Request.FormValue("userId")
	}

	if strings.Contains(userId, "@") {
		account := s.getAccountByEmail(userId)
		if account != nil {
			userId = account.Namespace
		}
	}

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
		verifyUrl := s.origin + "/landing/?t=" + account.Token + "&u=" + account.Namespace
		err = s.email.SendVerificationEmail(account.Name, account.EmailAddress, verifyUrl)
	} else {
		resetUrl := s.origin + "/login/recover?t=" + token
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
	token.Claims["orig_iat"] = time.Now().Unix()
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
			Description: s.Config.Name + " administrator",
			Password:    password,
			ResourceLimits: api.AccountResourceLimits{
				CPUMax:        s.Config.DefaultLimits.CpuMax,
				CPUDefault:    s.Config.DefaultLimits.CpuDefault,
				MemoryMax:     s.Config.DefaultLimits.MemMax,
				MemoryDefault: s.Config.DefaultLimits.MemDefault,
				StorageQuota:  s.Config.DefaultLimits.StorageDefault,
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

//func (s *Server) DownloadClient(w http.ResponseWriter, r *http.Request) {
func (s *Server) DownloadClient(w rest.ResponseWriter, r *rest.Request) {
	ops := r.URL.Query().Get("os")
	if ops != "darwin" && ops != "linux" {
		html := "<html><body>" +
			"<a href=\"download?os=darwin\">ndslabsctl-darwin-amd64</a><br/>" +
			"<a href=\"download?os=linux\">ndslabsctl-linux-amd64</a><br/>" +
			"</body></html>"
		w.(http.ResponseWriter).Write([]byte(html))
	} else {
		w.Header().Set("Content-Disposition", "attachment; filename=ndslabsctl")
		w.Header().Set("Content-Type", r.Header.Get("Content-Type"))

		reader, err := os.Open("/ndslabsctl/ndslabsctl-" + ops + "-amd64")
		if err != nil {
			glog.Error(err)
			return
		}

		defer reader.Close()
		io.Copy(w.(http.ResponseWriter), reader)
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
		"email": s.Config.Support.Email,
		"forum": s.Config.Support.Forum,
		"chat":  s.Config.Support.Chat,
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

func (s *Server) hasRequiredDependencies(service *api.ServiceSpec) bool {
	for _, dep := range service.Dependencies {
		if dep.Required {
			return true
		}
	}
	return false
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

// Import an account. Admin only. Assumes account does not exist.
func (s *Server) ImportAccount(w rest.ResponseWriter, r *rest.Request) {

	if !s.IsAdmin(r) {
		rest.Error(w, "", http.StatusForbidden)
		return
	}

	exportPkg := api.ExportPackage{}
	err := r.DecodeJsonPayload(&exportPkg)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	account := exportPkg.Account

	if s.accountExists(account.Namespace) {
		w.WriteHeader(http.StatusConflict)
		return
	}

	err = s.etcd.PutAccount(account.Namespace, &account, false)
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

	w.WriteJson(&account)
}

// Export account. Admin only.
func (s *Server) ExportAccount(w rest.ResponseWriter, r *rest.Request) {
	userId := r.PathParam("userId")
	if !s.IsAdmin(r) {
		rest.Error(w, "", http.StatusForbidden)
		return
	}

	account, err := s.etcd.GetAccount(userId)
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		w.WriteJson(&err)
		return
	}
	account.ResourceUsage = api.ResourceUsage{}
	account.Token = ""

	w.WriteJson(api.ExportPackage{
		Account: *account,
	})
}

// Shutdown all running stacks for all users. Admin only.
func (s *Server) StopAllStacks(w rest.ResponseWriter, r *rest.Request) {

	if !s.IsAdmin(r) {
		rest.Error(w, "", http.StatusForbidden)
		return
	}

	accounts, err := s.etcd.GetAccounts()
	if err != nil {
		glog.Error(err)
		rest.Error(w, err.Error(), http.StatusInternalServerError)
		w.WriteJson(&err)
	} else {
		for _, account := range *accounts {
			stacks, err := s.etcd.GetStacks(account.Namespace)
			for _, stack := range *stacks {
				glog.V(4).Infof("Stopping stack %s for account \n", stack.Id, account.Namespace)
				_, err = s.stopStack(account.Namespace, stack.Id)
				if err == nil {
					glog.V(4).Infof("Stack %s stopped \n", stack.Id)
				} else {
					glog.Error(err)
				}
			}
		}
	}
	w.WriteHeader(http.StatusOK)
}

func readConfig(path string) (*config.Config, error) {
	if path[len(path)-4:len(path)] != "json" {
		return nil, fmt.Errorf("Invalid config json")
	}
	glog.V(4).Infof("Using config %s", path)
	config := config.Config{}
	data, err := ioutil.ReadFile(path)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	err = json.Unmarshal(data, &config)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	return &config, nil
}

func (s *Server) shutdownInactiveServices() {
	for {
		accounts, err := s.etcd.GetAccounts()
		if err != nil {
			glog.Error(err)
		}

		for _, account := range *accounts {
			// InactiveTimeout in hours
			timeout := time.Duration(account.InactiveTimeout) * time.Minute
			diff := time.Duration(time.Now().Unix()-account.LastLogin) * time.Second
			if account.LastLogin > 0 && account.InactiveTimeout > 0 &&
				diff.Seconds() > timeout.Seconds() {

				stacks, err := s.etcd.GetStacks(account.Namespace)
				if err != nil {
					glog.Error(err)
				}
				for _, stack := range *stacks {
					if stack.Status != stackStatus[Stopped] {
						glog.Infof("Stopping stack %s for %s due to inactivity\n", stack.Id, account.Namespace)
						_, err = s.stopStack(account.Namespace, stack.Id)
						if err == nil {
							glog.V(4).Infof("Stack %s stopped \n", stack.Id)
						} else {
							glog.Error(err)
						}
					}
				}
			}
		}
		time.Sleep(1 * time.Minute)
	}

}

func (s *Server) PutLogLevel(w rest.ResponseWriter, r *rest.Request) {
	if !s.IsAdmin(r) {
		rest.Error(w, "", http.StatusForbidden)
		return
	}

	level := r.PathParam("level")

	_, err := strconv.Atoi(level)
	if err == nil {
		glog.Infof("Setting log level to %s\n", level)
		flag.Lookup("v").Value.Set(level)
	} else {
		glog.Infof("Invalid log level %s\n", level)
	}
}

func (s *Server) getAccountByEmail(email string) *api.Account {
	accounts, _ := s.etcd.GetAccounts()
	if accounts == nil {
		return nil
	}

	for _, account := range *accounts {
		if account.EmailAddress == strings.ToLower(email) {
			return &account
		}
	}
	return nil
}

// NDS-970
func (s *Server) getVolPath(mount *api.VolumeMount, ssid string) string {
	if len(mount.DefaultPath) == 0 {
		return fmt.Sprintf("AppData/%s", s.getAppDataDir(ssid))
	} else {
		return mount.DefaultPath
	}
}

// Check if host exists in ingresses for namespace
func (s *Server) checkIngress(uid string, host string) (bool, error) {

	glog.V(4).Infof("Checking ingress for %s %s", uid, host)
	ingresses, err := s.kube.GetIngresses(uid)
	if err != nil {
		glog.Error(err)
		return false, err
	}
	if ingresses != nil {
		for _, ingress := range ingresses {
			if ingress.Spec.Rules[0].Host == host {
				glog.V(4).Infof("Found ingress with host %s", ingress.Spec.Rules[0].Host)
				return true, nil
			}
		}
	}
	return false, nil
}

// Write the oauth2 payload to the users home directory for access from applications
func (s *Server) writeAuthPayload(userId string, tokens map[string]string) error {
	path := s.getHomeVolume().Path + "/" + userId + "/.globus"
	os.MkdirAll(path, 0777)

	json, err := json.MarshalIndent(tokens, "", "   ")
	if err != nil {
		return err
	}

	err = ioutil.WriteFile(path+"/oauth2.json", json, 0777)
	if err != nil {
		return err
	}
	return nil
}

// Register a user via oauth
func (s *Server) RegisterUserOauth(w http.ResponseWriter, r *http.Request) {

	rd := r.FormValue("rd")
	if rd == "" {
		rd = "https://www." + s.domain + "/dashboard"
	}

	accessToken := r.Header.Get("X-Forwarded-Access-Token")
	otherTokenStr := r.Header.Get("X-Forwarded-Other-Tokens")
	email := r.Header.Get("X-Forwarded-Email")
	user := r.Header.Get("X-Forwarded-User")

	if accessToken == "" || email == "" || user == "" {
		glog.Warning("No oauth header found")
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	tokens := make(map[string]string)
	otherTokens := strings.Split(otherTokenStr, " ")
	for _, kvpair := range otherTokens {
		kv := strings.Split(kvpair, "=")
		tokens[kv[0]] = kv[1]
	}

	err := s.writeAuthPayload(user, tokens)
	if err != nil {
		glog.Error(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	glog.Infof("Creating/updating account for %s %s %s\n", user, email, accessToken)
	glog.Infof("Other tokens %s\n", otherTokens)

	account := s.getAccountByEmail(email)
	if account == nil {
		act := api.Account{
			Name:         user,
			Description:  "Oauth shadow account",
			Namespace:    user,
			EmailAddress: email,
			Password:     s.kube.RandomString(10),
			Organization: "",
			Created:      time.Now().Unix(),
			LastLogin:    time.Now().Unix(),
			NextURL:      rd,
		}
		act.Status = api.AccountStatusApproved

		err := s.etcd.PutAccount(act.Namespace, &act, true)
		if err != nil {
			glog.Error(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		err = s.setupAccount(&act)
		if err != nil {
			glog.Error(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

	} else {
		account.LastLogin = time.Now().Unix()
		account.NextURL = rd

		err := s.etcd.PutAccount(account.Namespace, account, true)
		if err != nil {
			glog.Error(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

	}

	token, err := s.getTemporaryToken(user)
	if err != nil {
		glog.Error(err)
		w.WriteHeader(http.StatusOK)
		return
	}

	glog.Infof("Setting Cookie\n")
	//expiration := time.Now().Add(365 * 24 * time.Hour)
	http.SetCookie(w, &http.Cookie{Name: "token", Value: token, Domain: s.domain, Path: "/"})
	http.SetCookie(w, &http.Cookie{Name: "namespace", Value: user, Domain: s.domain, Path: "/"})

	glog.Infof("Redirecting to %s\n", rd)
	http.Redirect(w, r, rd, 301)
	return
}
