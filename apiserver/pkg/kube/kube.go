// Copyright © 2016 National Data Service
package kube

import (
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
	"time"

	// Used by exec
	//"net/url"
	//restclient "k8s.io/client-go/rest"
	//"k8s.io/apimachinery/pkg/util/remotecommand"
	//remotecommandserver "k8s.io/kubernetes/pkg/kubelet/server/remotecommand"

	"github.com/golang/glog"
	"github.com/ndslabs/apiserver/pkg/config"
	"github.com/ndslabs/apiserver/pkg/events"
	ndsapi "github.com/ndslabs/apiserver/pkg/types"
	"golang.org/x/net/websocket"
	utilrand "k8s.io/apimachinery/pkg/util/rand"

	"k8s.io/api/core/v1"
        networkingv1 "k8s.io/api/networking/v1"
	"k8s.io/api/extensions/v1beta1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/cache"
)

var apiBase = "/api/v1"
var extBase = "/apis/extensions/v1beta1"
var defaultShell = "sh"

type ServiceAddrPort struct {
	Name     string
	Host     string
	Port     int32
	NodePort int32
}

type KubeHelper struct {
	kubeBase      string
	client        *http.Client
	username      string
	password      string
	token         string
	kubeGo        kubernetes.Interface
	authSignInURL string
	authURL       string
}

func NewKubeHelper(kubeBase string, username string, password string, tokenPath string, kConfig *rest.Config,
	authSignInURL string, authURL string) (*KubeHelper, error) {
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}

	kubeHelper := KubeHelper{}
	kubeHelper.kubeBase = kubeBase
	kubeHelper.client = &http.Client{Transport: tr}

	// create the clientset
	kubeGo, k8Err := kubernetes.NewForConfig(kConfig)
	if k8Err != nil {
		panic(k8Err.Error())
	} else {
		kubeHelper.kubeGo = kubeGo
	}

	if _, err := os.Stat(tokenPath); err == nil {
		glog.V(4).Infof("Reading token from %s\n", tokenPath)
		token, err := ioutil.ReadFile(tokenPath)
		if err != nil {
			glog.Error("Unable to read token: %s\n", err)
		}
		kubeHelper.token = string(token)
	} else {
		kubeHelper.username = username
		kubeHelper.password = password
	}
	kubeHelper.authSignInURL = authSignInURL
	kubeHelper.authURL = authURL

	err := kubeHelper.isRunning()

	return &kubeHelper, err
}

func (k *KubeHelper) getAuthHeader() string {

	if len(k.token) > 0 {
		return fmt.Sprintf("Bearer %s", string(k.token))
	} else {
		up := fmt.Sprintf("%s:%s", k.username, k.password)
		return fmt.Sprintf("Basic %s", base64.StdEncoding.EncodeToString([]byte(up)))
	}
}

func (k *KubeHelper) isRunning() error {

	url := k.kubeBase + apiBase + "/"
	request, _ := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	_, httperr := k.client.Do(request)
	if httperr != nil {
		return httperr
	}
	return nil
}

func (k *KubeHelper) CreateNamespace(pid string) (*v1.Namespace, error) {
	ns := v1.Namespace{}
	ns.SetName(pid)

	return k.kubeGo.CoreV1().Namespaces().Create(&ns)
}

func (k *KubeHelper) CreateResourceQuota(pid string, cpu int, mem int) (*v1.ResourceQuota, error) {
	resourceQuota := v1.ResourceQuota{
		ObjectMeta: metav1.ObjectMeta{Name: "quota"},
		Spec: v1.ResourceQuotaSpec{
			Hard: v1.ResourceList{
				v1.ResourceCPU:    resource.MustParse(fmt.Sprintf("%dm", cpu)),
				v1.ResourceMemory: resource.MustParse(fmt.Sprintf("%dM", mem)),
			},
		},
	}

	return k.kubeGo.CoreV1().ResourceQuotas(pid).Create(&resourceQuota)
}

func (k *KubeHelper) CreateLimitRange(pid string, cpu int, mem int) (*v1.LimitRange, error) {

	limitRange := v1.LimitRange{
		Spec: v1.LimitRangeSpec{
			Limits: []v1.LimitRangeItem{
				{
					Type: v1.LimitTypeContainer,
					Default: v1.ResourceList{
						v1.ResourceCPU:    resource.MustParse(fmt.Sprintf("%dm", cpu)),
						v1.ResourceMemory: resource.MustParse(fmt.Sprintf("%dM", mem)),
					},
				},
			},
		},
	}

	return k.kubeGo.CoreV1().LimitRanges(pid).Create(&limitRange)
}

func (k *KubeHelper) GetNamespace(pid string) (*v1.Namespace, error) {
	return k.kubeGo.CoreV1().Namespaces().Get(pid, metav1.GetOptions{})
}

func (k *KubeHelper) NamespaceExists(pid string) bool {
	ns, err := k.GetNamespace(pid)
	return (ns != nil && err == nil)
}

func (k *KubeHelper) DeleteNamespace(pid string) error {
	deleteOptions := metav1.DeleteOptions{}
	return k.kubeGo.CoreV1().Namespaces().Delete(pid, &deleteOptions)
}

// Start the specified replication controller
func (k *KubeHelper) StartController(pid string, spec *v1.ReplicationController) (bool, error) {

	//name := spec.Labels["name"]
	rslt, err := k.kubeGo.CoreV1().ReplicationControllers(pid).Create(spec)

	// Give Kubernetes time to create the pods for the RC
	time.Sleep(time.Second * 5)

	return rslt != nil, err
}

func (k *KubeHelper) StartService(pid string, spec *v1.Service) (*v1.Service, error) {
	return k.kubeGo.CoreV1().Services(pid).Create(spec)
}

func (k *KubeHelper) ServiceExists(pid string, name string) bool {
	service, _ := k.GetService(pid, name)
	if service.Name != "" {
		return true
	} else {
		return false
	}
}

func (k *KubeHelper) GetService(pid string, name string) (*v1.Service, error) {
	return k.kubeGo.CoreV1().Services(pid).Get(name, metav1.GetOptions{})
}

func (k *KubeHelper) GetServices(pid string, stack string) (*v1.ServiceList, error) {
	listOptions := metav1.ListOptions{
		LabelSelector: "stack=" + stack,
	}

	return k.kubeGo.CoreV1().Services(pid).List(listOptions)
}

func (k *KubeHelper) GetReplicationControllers(pid string, label string, value string) (*v1.ReplicationControllerList, error) {
	listOptions := metav1.ListOptions{
		LabelSelector: label + "=" + value,
	}

	return k.kubeGo.CoreV1().ReplicationControllers(pid).List(listOptions)
}

func (k *KubeHelper) GetPods(pid string, label string, value string) (*v1.PodList, error) {

	listOptions := metav1.ListOptions{
		LabelSelector: label + "=" + value,
	}

	return k.kubeGo.CoreV1().Pods(pid).List(listOptions)
}

func (k *KubeHelper) StopService(pid string, name string) error {

	deleteOptions := metav1.DeleteOptions{}
	return k.kubeGo.CoreV1().Services(pid).Delete(name, &deleteOptions)
}

func (k *KubeHelper) StopController(pid string, name string) error {
	deleteOptions := metav1.DeleteOptions{}
	rcDeleteErr := k.kubeGo.CoreV1().ReplicationControllers(pid).Delete(name, &deleteOptions)

	if rcDeleteErr != nil {
		return rcDeleteErr
	}

	rcs, _ := k.GetReplicationControllers(pid, "name", name)
	glog.V(4).Infof("Waiting for rc to terminate %s %d\n", name, len(rcs.Items))
	for len(rcs.Items) > 0 {
		rcs, _ = k.GetReplicationControllers(pid, "name", name)
		time.Sleep(time.Second * 1)
	}

	stopped := map[string]int{}
	pods, _ := k.GetPods(pid, "name", name)
	glog.V(4).Infof("Waiting for pods to terminate %s %d\n", name, len(pods.Items))
	for len(pods.Items) > 0 {
		for _, pod := range pods.Items {
			if stopped[pod.Name] != 1 {
				err := k.stopPod(pid, pod.Name)
				if err != nil {
					glog.Error(err)
					return err
				}
				stopped[pod.Name] = 1
			}

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
		pods, _ = k.GetPods(pid, "name", name)
		time.Sleep(time.Second * 3)
	}
	return nil
}

func (k *KubeHelper) stopPod(pid string, podName string) error {
	glog.V(4).Infof("Stopping pod %s\n", podName)

	deleteOptions := metav1.DeleteOptions{}

	return k.kubeGo.CoreV1().Pods(pid).Delete(podName, &deleteOptions)
}

func (k *KubeHelper) GetLog(pid string, podName string, tailLines int) (string, error) {
	glog.V(4).Infof("Get log for %s %s\n", pid, podName)

	var tailLines64 int64 = int64(tailLines)
	podLogOptions := v1.PodLogOptions{
		TailLines: &tailLines64,
	}

	request := k.kubeGo.CoreV1().Pods(pid).GetLogs(podName, &podLogOptions)

	readCloser, err := request.Stream()

	if err == nil {
		buf := new(bytes.Buffer)
		buf.ReadFrom(readCloser)
		return buf.String(), nil
	} else {
		return "", err
	}
}

func (k *KubeHelper) GetPodsStatus(pid string, selector string) (*map[string]string, error) {

	// Get the pods for this stack
	podStatus := make(map[string]string)
	pods, _ := k.GetPods(pid, "rc", selector)
	for _, pod := range pods.Items {
		label := pod.Labels["name"]
		glog.V(4).Infof("Pod %s %d\n", label, len(pod.Status.Conditions))
		if len(pod.Status.Conditions) > 0 {
			podStatus[label] = string(pod.Status.Phase)
		}
	}
	return &podStatus, nil
}

func (k *KubeHelper) GetServiceEndpoints(pid string, stackKey string) (*map[string]string, error) {

	k8services, _ := k.GetServices(pid, stackKey)
	endpoints := make(map[string]string)
	for _, k8service := range k8services.Items {
		glog.V(4).Infof("Service : %s %s\n", k8service.Name, k8service.Spec.Type)
		if k8service.Spec.Type == "NodePort" {
			glog.V(4).Infof("NodePort : %d\n", k8service.Spec.Ports[0].NodePort)
			endpoints[k8service.GetName()] = fmt.Sprintf("%d", k8service.Spec.Ports[0].NodePort)
		}
	}
	return &endpoints, nil
}

func (k *KubeHelper) generateStackName(stack string, service string, randomLength int) string {
	return fmt.Sprintf("%s-%s-%s", stack, service, utilrand.String(randomLength))
}

func (k *KubeHelper) RandomString(randomLength int) string {
	return utilrand.String(randomLength)
}

func (k *KubeHelper) CreateServiceTemplate(name string, stack string, spec *ndsapi.ServiceSpec,
	useNodePort bool) *v1.Service {

	// Create the Kubernetes service definition
	k8svc := v1.Service{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "v1",
			Kind:       "Service",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
			Labels: map[string]string{
				"name":    name,
				"stack":   stack,
				"service": spec.Key,
			},
		},
		Spec: v1.ServiceSpec{
			Selector: map[string]string{
				"name": name,
			},
		},
	}

	if useNodePort && spec.Access == ndsapi.AccessExternal {
		k8svc.Spec.Type = v1.ServiceTypeNodePort
	}

	if len(spec.Ports) > 0 {
		for _, port := range spec.Ports {
			k8port := v1.ServicePort{
				Name: fmt.Sprintf("%d", port.Port),
				Port: port.Port,
			}
			// For now, assume all ports are TCP
			k8port.Protocol = v1.ProtocolTCP
			k8svc.Spec.Ports = append(k8svc.Spec.Ports, k8port)
		}
	}

	return &k8svc
}


func (k *KubeHelper) CreateNetworkPolicy(ns string, name string, groupName string) *networkingv1.NetworkPolicy {
	k8netPolicy := networkingv1.NetworkPolicy{
		TypeMeta: metav1.TypeMeta{
			Kind: "NetworkPolicy",
       			APIVersion: "networking.k8s.io/v1",
        	},
		ObjectMeta: metav1.ObjectMeta{
                	Name: name,
                	Namespace: ns,
        	},
		Spec: networkingv1.NetworkPolicySpec{
			PodSelector: metav1.LabelSelector{},
        	        Ingress: []networkingv1.NetworkPolicyIngressRule{
				networkingv1.NetworkPolicyIngressRule{
					From: []networkingv1.NetworkPolicyPeer{
						networkingv1.NetworkPolicyPeer{
							PodSelector: &metav1.LabelSelector{
								MatchLabels: map[string]string{
									"group": groupName,
								},
							},
						},
					},
				},
			},
			Egress: []networkingv1.NetworkPolicyEgressRule{
				networkingv1.NetworkPolicyEgressRule{
					To: []networkingv1.NetworkPolicyPeer{
						networkingv1.NetworkPolicyPeer{
							PodSelector: &metav1.LabelSelector{
								MatchLabels: map[string]string{
									"group": groupName,
								},
							},
						},
					},
				},
			},
			PolicyTypes: []networkingv1.PolicyType{},
	        },

	}

	_, err := k.kubeGo.NetworkingV1().NetworkPolicies(ns).Create(&k8netPolicy)
	if err != nil {
                glog.Errorf("Error creating NetworkPolicy %s in namespace %s: %s\n", name, ns, err)
	}

	return &k8netPolicy
}

func (k *KubeHelper) NetworkPolicyExists(ns string, name string) bool {
        getOptions := metav1.GetOptions{}
        _, err := k.kubeGo.NetworkingV1().NetworkPolicies(ns).Get(name, getOptions)
	if err != nil {
		return false
	}
	return true
}

func (k *KubeHelper) DeleteNetworkPolicy(ns string, name string) error {
	deleteOptions := metav1.DeleteOptions{}
	return k.kubeGo.NetworkingV1().NetworkPolicies(ns).Delete(name, &deleteOptions)
}

func (k *KubeHelper) CreatePersistentVolumeClaim(ns string, name string, storageClass string) *v1.PersistentVolumeClaim {
        k8pvc := v1.PersistentVolumeClaim{}

        // PersistentVolumeClaim
        k8pvc.APIVersion = "v1"
        k8pvc.Kind = "PersistentVolumeClaim"
        k8pvc.Name = name
        k8pvc.Labels = map[string]string{
                "name":    name,
        }

        // Since we use ReadWriteMany, capacity can be any value
	k8rq := v1.ResourceRequirements{}
        k8rq.Requests = v1.ResourceList{
                v1.ResourceStorage:  resource.MustParse("1Mi"),
        }

	k8pvc.Spec = v1.PersistentVolumeClaimSpec{
		Resources: k8rq,
		AccessModes: []v1.PersistentVolumeAccessMode{
                	v1.ReadWriteMany,
        	},
	}

        // if storageClass is explicitly specified, use it (otherwise rely on cluster default)
        if storageClass != "" {
                k8pvc.Spec.StorageClassName = &storageClass
        }

        _, err := k.kubeGo.CoreV1().PersistentVolumeClaims(ns).Create(&k8pvc)

        // Give Kubernetes time to bind a PersistentVolume for this PVC
        //time.Sleep(time.Second * 5)

	if err != nil { 
                glog.Errorf("Error creating PVC %s in namespace %s: %s\n", name, ns, err)
	}

        return &k8pvc
}

func (k *KubeHelper) DeletePersistentVolumeClaim(pid string, name string) error {
        deleteOptions := metav1.DeleteOptions{}
        return k.kubeGo.CoreV1().PersistentVolumeClaims(pid).Delete(name, &deleteOptions)
}

func (k *KubeHelper) CreateControllerTemplate(ns string, name string, stack string, domain string,
	emailAddress string, smtpHost string, stackService *ndsapi.StackService, spec *ndsapi.ServiceSpec,
	links *map[string]ServiceAddrPort, extraVols *[]config.Volume, nodeSelectorName string, nodeSelectorValue string) *v1.ReplicationController {

	k8rc := v1.ReplicationController{}

	// Replication controller
	k8rc.APIVersion = "v1"
	k8rc.Kind = "ReplicationController"
	k8rc.Name = name
	k8rc.Labels = map[string]string{
		"name":    name,
		"stack":   stack,
		"service": spec.Key,
	}

	homeDir := "/home/" + ns
	env := []v1.EnvVar{}
	env = append(env, v1.EnvVar{Name: "NDSLABS_HOSTNAME", Value: name + "." + domain})
	env = append(env, v1.EnvVar{Name: "NDSLABS_DOMAIN", Value: domain})
	env = append(env, v1.EnvVar{Name: "NDSLABS_EMAIL", Value: emailAddress})
	env = append(env, v1.EnvVar{Name: "NDSLABS_STACK", Value: stack})
	env = append(env, v1.EnvVar{Name: "NAMESPACE", Value: ns})
	env = append(env, v1.EnvVar{Name: "NDSLABS_HOME", Value: homeDir})
	env = append(env, v1.EnvVar{Name: "TERM", Value: "linux"})
	env = append(env, v1.EnvVar{Name: "COLUMNS", Value: "100"})
	env = append(env, v1.EnvVar{Name: "LINES", Value: "30"})
	env = append(env, v1.EnvVar{Name: "NDSLABS_SMTP_HOST", Value: smtpHost})

	for name, addrPort := range *links {

		if addrPort.NodePort > 0 {
			env = append(env,
				v1.EnvVar{
					Name:  fmt.Sprintf("%s_NODE_PORT", strings.ToUpper(name)),
					Value: fmt.Sprintf("%d", addrPort.NodePort),
				})
		}

		if name == spec.Key {
			continue
		}

		env = append(env,
			v1.EnvVar{
				Name:  fmt.Sprintf("%s_PORT_%d_TCP_ADDR", strings.ToUpper(name), addrPort.Port),
				Value: addrPort.Host,
			})

		env = append(env,
			v1.EnvVar{
				Name:  fmt.Sprintf("%s_PORT_%d_TCP_PORT", strings.ToUpper(name), addrPort.Port),
				Value: fmt.Sprintf("%d", addrPort.Port),
			})
	}

	for name, value := range stackService.Config {
		env = append(env, v1.EnvVar{Name: name, Value: value})
	}

	k8volMounts := []v1.VolumeMount{}

	// Mount the home directory
	k8homeVol := v1.VolumeMount{Name: "home", MountPath: homeDir}
	k8volMounts = append(k8volMounts, k8homeVol)

	// Mount additional shared directories
	for _, volume := range *extraVols {
		k8vol := v1.VolumeMount{
			Name:      volume.Name,
			MountPath: volume.Path,
			ReadOnly:  volume.ReadOnly,
		}
		k8volMounts = append(k8volMounts, k8vol)
	}

	if len(spec.VolumeMounts) > 0 {
		for i, vol := range spec.VolumeMounts {
			volName := fmt.Sprintf("vol%d", i)
			if vol.Type == ndsapi.MountTypeDocker {
				volName = "docker"
			}
			k8vol := v1.VolumeMount{Name: volName, MountPath: vol.MountPath}
			k8volMounts = append(k8volMounts, k8vol)
		}
	}

	k8cps := []v1.ContainerPort{}
	if len(spec.Ports) > 0 {
		for _, port := range spec.Ports {
			k8cp := v1.ContainerPort{}
			k8cp.ContainerPort = port.Port
			k8cps = append(k8cps, k8cp)
		}
	}

	k8rq := v1.ResourceRequirements{}
	if spec.ResourceLimits.CPUMax > 0 && spec.ResourceLimits.MemoryMax > 0 {
		k8rq.Limits = v1.ResourceList{
			v1.ResourceCPU:    resource.MustParse(fmt.Sprintf("%dm", spec.ResourceLimits.CPUMax)),
			v1.ResourceMemory: resource.MustParse(fmt.Sprintf("%dM", spec.ResourceLimits.MemoryMax)),
		}
		k8rq.Requests = v1.ResourceList{
			v1.ResourceCPU:    resource.MustParse(fmt.Sprintf("%dm", spec.ResourceLimits.CPUDefault)),
			v1.ResourceMemory: resource.MustParse(fmt.Sprintf("%dM", spec.ResourceLimits.MemoryDefault)),
		}
	} else {
		glog.Warningf("No resource requirements specified for service %s\n", spec.Label)
	}

	tag := ""
	if stackService.ImageTag != "" {
		tag = stackService.ImageTag
	} else if len(spec.Image.Tags) > 0 {
		tag = spec.Image.Tags[0]
	} else {
		tag = "latest"
	}
	k8template := v1.PodTemplateSpec{
		ObjectMeta: metav1.ObjectMeta{
			Labels: map[string]string{
				"name":    name,
				"stack":   stack,
				"service": spec.Key,
			},
		},
		Spec: v1.PodSpec{
			Containers: []v1.Container{
				v1.Container{
					Name:            spec.Key,
					Image:           spec.Image.Name + ":" + tag,
					Env:             env,
					VolumeMounts:    k8volMounts,
					Ports:           k8cps,
					Args:            spec.Args,
					Command:         spec.Command,
					Resources:       k8rq,
					ImagePullPolicy: v1.PullAlways,
					SecurityContext: &v1.SecurityContext{
						Privileged: &spec.Privileged,
					},
				},
			},
			NodeSelector: map[string]string{
				//"ndslabs-role-compute": "true",
			},
		},
	}

	if nodeSelectorName != "" {
		if nodeSelectorValue != "" {
			k8template.Spec.NodeSelector[nodeSelectorName] = nodeSelectorValue
		} else {
			k8template.Spec.NodeSelector[nodeSelectorName] = "true"
		}
	}

	if spec.ReadyProbe.Path != "" {
		if spec.ReadyProbe.Type == "http" {
			k8template.Spec.Containers[0].ReadinessProbe = k.createHttpProbe(spec.ReadyProbe.Path, spec.ReadyProbe.Port,
				spec.ReadyProbe.InitialDelay, 3)
			k8template.Spec.Containers[0].LivenessProbe = k.createHttpProbe(spec.ReadyProbe.Path,
				spec.ReadyProbe.Port, spec.ReadyProbe.Timeout, 2)
		} else if spec.ReadyProbe.Type == "tcp" {
			k8template.Spec.Containers[0].ReadinessProbe = k.createTcpProbe(spec.ReadyProbe.Port,
				spec.ReadyProbe.InitialDelay, 3)
			k8template.Spec.Containers[0].LivenessProbe = k.createTcpProbe(spec.ReadyProbe.Port,
				spec.ReadyProbe.Timeout, 2)
		}
	}

	var replicas int32 = 1

	k8rcs := v1.ReplicationControllerSpec{
		Replicas: &replicas,
		Selector: map[string]string{
			"name": name,
		},
		Template: &k8template,
	}

	k8rc.Spec = k8rcs
	return &k8rc
}

func (k *KubeHelper) GenerateName(randomLength int) string {
	return fmt.Sprintf("s%s", utilrand.String(randomLength))
}

func (k *KubeHelper) WatchEvents(handler events.EventHandler) {
	glog.V(4).Infoln("WatchEvents started")

	startTime := time.Now()

	podWatchlist := cache.NewListWatchFromClient(k.kubeGo.Core().RESTClient(), "pods", "",
		fields.Everything())

	_, podController := cache.NewInformer(
		podWatchlist,
		&v1.Pod{},
		time.Second*0,
		cache.ResourceEventHandlerFuncs{
			AddFunc: func(obj interface{}) {
				if obj.(*v1.Pod).GetCreationTimestamp().After(startTime) {
					fmt.Printf("pod added: %s \n", obj.(*v1.Pod).Name)
					handler.HandlePodEvent("ADDED", obj.(*v1.Pod))
					data, _ := json.MarshalIndent(obj.(*v1.Pod), "", "    ")
					fmt.Println(string(data))
				}
			},
			DeleteFunc: func(obj interface{}) {
				if obj.(*v1.Pod).GetDeletionTimestamp().After(startTime) {
					fmt.Printf("pod deleted: %s \n", obj.(*v1.Pod).Name)
					handler.HandlePodEvent("DELETED", obj.(*v1.Pod))
					data, _ := json.MarshalIndent(obj.(*v1.Pod), "", "    ")
					fmt.Println(string(data))
				}
			},
			UpdateFunc: func(oldObj, newObj interface{}) {
				fmt.Printf("pod updated: %s %s \n", oldObj.(*v1.Pod).Name, newObj.(*v1.Pod).Name)
				handler.HandlePodEvent("UPDATED", newObj.(*v1.Pod))
				data, _ := json.MarshalIndent(newObj.(*v1.Pod), "", "    ")
				fmt.Println(string(data))
			},
		},
	)

	go podController.Run(make(chan struct{}))

	rcWatchlist := cache.NewListWatchFromClient(k.kubeGo.Core().RESTClient(), "replicationcontrollers", "",
		fields.Everything())

	_, rcController := cache.NewInformer(
		rcWatchlist,
		&v1.ReplicationController{},
		time.Second*0,
		cache.ResourceEventHandlerFuncs{
			AddFunc: func(obj interface{}) {
				if obj.(*v1.ReplicationController).GetCreationTimestamp().After(startTime) {
					fmt.Printf("rc added: %s \n", obj.(*v1.ReplicationController).Name)
				}
			},
			DeleteFunc: func(obj interface{}) {
				if obj.(*v1.ReplicationController).GetDeletionTimestamp().After(startTime) {
					fmt.Printf("rc deleted: %s \n", obj.(*v1.ReplicationController).Name)
				}
			},
			UpdateFunc: func(oldObj, newObj interface{}) {
				fmt.Printf("rc changed %s -> %s\n", oldObj.(*v1.ReplicationController).Name, newObj.(*v1.ReplicationController).Name)
			},
		},
	)

	go rcController.Run(make(chan struct{}))
}

func (k *KubeHelper) Exec(pid string, pod string, container string, kube *KubeHelper) *websocket.Handler {

	//url, err := url.Parse(
	//	k.kubeBase + apiBase + "/namespaces/" + pid + "/pods/" + pod +
	//		"/exec?container=" + container + "&command=" + defaultShell + "&tty=true&stdin=true&stdout=true&stderr=false")
	//if err != nil {
	//	glog.Warning(err)
	//}
	//
	//conf := &restclient.Config{
	//	Host:     k.kubeBase,
	//	Insecure: true,
	//}
	//
	//if len(k.token) > 0 {
	//	conf.BearerToken = string(k.token)
	//} else {
	//	conf.Username = k.username
	//	conf.Password = k.password
	//}
	//
	//e, err := remotecommand.NewExecutor(conf, "POST", url)
	//if err != nil {
	//	glog.Warning(err)
	//}
	//
	//wsHandler := websocket.Handler(func(ws *websocket.Conn) {
	//	defer ws.Close()
	//
	//	outr, outw, err := os.Pipe()
	//	if err != nil {
	//		glog.Warning(err)
	//		return
	//	}
	//	defer outr.Close()
	//	defer outw.Close()
	//
	//	inr, inw, err := os.Pipe()
	//	if err != nil {
	//		glog.Fatal(err)
	//		return
	//	}
	//	defer inr.Close()
	//	defer inw.Close()
	//
	//	go func() {
	//		for {
	//
	//			in := make([]byte, 2048)
	//			n, err := ws.Read(in)
	//			if err != nil {
	//				//glog.Error(err)
	//				return
	//			}
	//			inLen, err := inw.Write(in[:n])
	//			if err != nil {
	//				glog.Error(err)
	//				return
	//			}
	//			if inLen < n {
	//				panic("pty write overflow")
	//			}
	//		}
	//	}()
	//
	//	go func() {
	//		for {
	//			out := make([]byte, 2048)
	//			n, err := outr.Read(out)
	//			if err != nil {
	//				//glog.Error(err)
	//				return
	//			}
	//			_, err = ws.Write(out[:n])
	//			if err != nil {
	//				glog.Error(err)
	//				return
	//			}
	//		}
	//	}()
	//
	//	err = e.Stream(remotecommandserver.SupportedStreamingProtocols, inr, outw, nil, true)
	//	if err != nil {
	//		glog.Error(err)
	//		return
	//	}
	//})
	//
	//return &wsHandler
	return nil
}

func (k *KubeHelper) CreateIngress(pid string, domain string, service string, ports []v1.ServicePort, enableAuth bool) (*v1beta1.Ingress, error) {

	name := service + "-ingress"
	update := true

	ingress, _ := k.GetIngress(pid, name)
	if ingress.Name == "" {
		update = false

		ingress = &v1beta1.Ingress{
			ObjectMeta: metav1.ObjectMeta{
				Name:      name,
				Namespace: pid,
			},
		}
	}

	hosts := []string{}
	if len(ports) == 1 {
		host := fmt.Sprintf("%s.%s", service, domain)
		rule := k.createIngressRule(service, host, int(ports[0].Port))
		ingress.Spec.Rules = append(ingress.Spec.Rules, rule)
		hosts = append(hosts, host)
	} else {
		for _, port := range ports {
			host := fmt.Sprintf("%s-%d.%s", service, port.Port, domain)
			rule := k.createIngressRule(service, host, int(port.Port))
			ingress.Spec.Rules = append(ingress.Spec.Rules, rule)
			hosts = append(hosts, host)
		}
	}

	annotations := map[string]string{}
	if enableAuth {
		annotations["nginx.ingress.kubernetes.io/auth-signin"] = k.authSignInURL
		annotations["nginx.ingress.kubernetes.io/auth-url"] = k.authURL
	} else {
		glog.V(4).Info("Removing auth annotations for " + ingress.Name)
	}
	ingress.Annotations = annotations
	ingress.Spec.TLS = []v1beta1.IngressTLS{
		v1beta1.IngressTLS{
			Hosts: hosts,
		},
	}

	return k.CreateUpdateIngress(pid, ingress, update)
}

func (k *KubeHelper) createIngressRule(service string, host string, port int) v1beta1.IngressRule {
	rule := v1beta1.IngressRule{
		Host: host,
		IngressRuleValue: v1beta1.IngressRuleValue{
			HTTP: &v1beta1.HTTPIngressRuleValue{
				Paths: []v1beta1.HTTPIngressPath{
					v1beta1.HTTPIngressPath{
						Path: "/",
						Backend: v1beta1.IngressBackend{
							ServiceName: service,
							ServicePort: intstr.FromInt(port),
						},
					},
				},
			},
		},
	}
	return rule
}

func (k *KubeHelper) CreateUpdateIngress(pid string, ingress *v1beta1.Ingress, update bool) (*v1beta1.Ingress, error) {

	glog.V(4).Info("Updating ingress " + ingress.Name)
	ingress.ObjectMeta.Annotations["ndslabs.org/updated"] = time.Now().String()

	if update {
		return k.kubeGo.ExtensionsV1beta1().Ingresses(pid).Update(ingress)

	} else {
		return k.kubeGo.ExtensionsV1beta1().Ingresses(pid).Create(ingress)
	}
}

func (k *KubeHelper) GetIngress(pid string, ingressName string) (*v1beta1.Ingress, error) {
	return k.kubeGo.ExtensionsV1beta1().Ingresses(pid).Get(ingressName, metav1.GetOptions{})
}

func (k *KubeHelper) GetIngresses(pid string) (*v1beta1.IngressList, error) {
	listOptions := metav1.ListOptions{}
	return k.kubeGo.ExtensionsV1beta1().Ingresses(pid).List(listOptions)
}

//http://kubernetes.io/docs/api-reference/extensions/v1beta1/operations/
func (k *KubeHelper) DeleteIngress(pid string, name string) error {
	deleteOptions := metav1.DeleteOptions{}
	return k.kubeGo.ExtensionsV1beta1().Ingresses(pid).Delete(name, &deleteOptions)
}

func (k *KubeHelper) CreateBasicAuthSecret(pid string, username string, email string, hashedPassword string) (*v1.Secret, error) {
	secret, _ := k.GetSecret(pid, "basic-auth")
	if secret != nil {
		k.DeleteSecret(pid, "basic-auth")
	}

	secret = &v1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "basic-auth",
			Namespace: pid,
		},
		Data: map[string][]byte{
			"auth": []byte(fmt.Sprintf("%s:%s\n%s:%s", username, string(hashedPassword), email, hashedPassword)),
		},
	}
	return k.CreateSecret(pid, secret)
}

func (k *KubeHelper) CreateTLSSecret(pid string, secretName string, tlsCert []byte, tlsKey []byte) (*v1.Secret, error) {

	secret := v1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      secretName,
			Namespace: pid,
		},
		Data: map[string][]byte{
			"tls.crt": tlsCert,
			"tls.key": tlsKey,
		},
	}
	return k.CreateSecret(pid, &secret)
}

func (k *KubeHelper) CreateSecret(pid string, secret *v1.Secret) (*v1.Secret, error) {
	return k.kubeGo.CoreV1().Secrets(pid).Create(secret)
}

func (k *KubeHelper) DeleteSecret(pid string, name string) error {

	deleteOptions := metav1.DeleteOptions{}
	return k.kubeGo.CoreV1().Secrets(pid).Delete(name, &deleteOptions)
}

func (k *KubeHelper) GetSecret(pid string, secretName string) (*v1.Secret, error) {
	return k.kubeGo.CoreV1().Secrets(pid).Get(secretName, metav1.GetOptions{})
}

func (k *KubeHelper) GetResourceQuota(pid string) (*v1.ResourceQuotaList, error) {

	resourceListOptions := metav1.ListOptions{}
	return k.kubeGo.CoreV1().ResourceQuotas(pid).List(resourceListOptions)
}

// Execute an arbitrary command in the specified pod and return stdout
func (k *KubeHelper) ExecCommand(pid string, pod string, command []string) (string, error) {

	/*
		urlStr := k.kubeBase + apiBase + "/namespaces/" + pid + "/pods/" + pod +
			"/exec?&stderr=false&stdin=false&stdout=true&tty=false"
		for _, arg := range command {
			urlStr += "&command=" + url.QueryEscape(arg)
		}
		u, err := url.Parse(urlStr)
		if err != nil {
			glog.Warning(err)
		}
		fmt.Println(u.String())

		conf := &restclient.Config{
			Host:     k.kubeBase,
			Insecure: true,
		}

		if len(k.token) > 0 {
			conf.BearerToken = string(k.token)
		} else {
			conf.Username = k.username
			conf.Password = k.password
		}

		e, err := remotecommand.NewExecutor(conf, "POST", u)
		if err != nil {
			glog.Warning(err)
		}

		localOut := &bytes.Buffer{}
		localErr := &bytes.Buffer{}
		err = e.Stream(remotecommandserver.SupportedStreamingProtocols, nil, localOut, localErr, false)
		return localOut.String(), err
	*/
	return "", nil
}

func (k *KubeHelper) createHttpProbe(path string, port int, initialDelay int32, threshold int32) *v1.Probe {
	return &v1.Probe{
		Handler: v1.Handler{
			HTTPGet: &v1.HTTPGetAction{
				Path:   path,
				Port:   intstr.FromInt(port),
				Scheme: v1.URISchemeHTTP,
			},
		},
		InitialDelaySeconds: initialDelay,
		FailureThreshold:    threshold,
	}
}

func (k *KubeHelper) createTcpProbe(port int, initialDelay int32, threshold int32) *v1.Probe {
	return &v1.Probe{
		Handler: v1.Handler{
			TCPSocket: &v1.TCPSocketAction{
				Port: intstr.FromInt(port),
			},
		},
		InitialDelaySeconds: initialDelay,
		FailureThreshold:    threshold,
	}
}
