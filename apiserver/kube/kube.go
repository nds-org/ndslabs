// Copyright © 2016 National Data Service
package kube

import (
	"bufio"
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/golang/glog"
	"github.com/ndslabs/apiserver/events"
	ndsapi "github.com/ndslabs/apiserver/types"
	"golang.org/x/net/websocket"
	"k8s.io/kubernetes/pkg/api"
	"k8s.io/kubernetes/pkg/api/resource"
	"k8s.io/kubernetes/pkg/api/unversioned"
	"k8s.io/kubernetes/pkg/apis/extensions"
	"k8s.io/kubernetes/pkg/client/restclient"
	"k8s.io/kubernetes/pkg/client/unversioned/remotecommand"
	remotecommandserver "k8s.io/kubernetes/pkg/kubelet/server/remotecommand"
	intstr "k8s.io/kubernetes/pkg/util/intstr"
	utilrand "k8s.io/kubernetes/pkg/util/rand"
	watch "k8s.io/kubernetes/pkg/watch/json"
)

var apiBase = "/api/v1"
var extBase = "/apis/extensions/v1beta1"

type ServiceAddrPort struct {
	Name     string
	Host     string
	Port     int32
	NodePort int32
}

type KubeHelper struct {
	kubeBase string
	client   *http.Client
	username string
	password string
	token    string
}

func NewKubeHelper(kubeBase string, username string, password string, tokenPath string) (*KubeHelper, error) {
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}

	kubeHelper := KubeHelper{}
	kubeHelper.kubeBase = kubeBase
	kubeHelper.client = &http.Client{Transport: tr}

	if _, err := os.Stat(tokenPath); err == nil {
		glog.V(4).Infof("Reading token from %s\n", tokenPath)
		token, err := ioutil.ReadFile(tokenPath)
		if err != nil {
			glog.Error("Unable to read token: %s\n", err)
		}
		kubeHelper.token = string(token)
	} else {
		kubeHelper.username = username
		kubeHelper.username = username
	}

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

func (k *KubeHelper) CreateNamespace(pid string) (*api.Namespace, error) {

	// Create the K8 namespace
	ns := api.Namespace{}
	ns.SetName(pid)

	data, err := json.Marshal(ns)
	if err != nil {
		return nil, err
	}

	url := k.kubeBase + apiBase + "/namespaces"
	glog.V(4).Infoln(url)
	request, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	httpresp, httperr := k.client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return nil, httperr
	} else {
		if httpresp.StatusCode == http.StatusCreated {
			glog.V(2).Infof("Added namespace %s\n", pid)
			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				return nil, err
			}

			json.Unmarshal(data, &ns)
			return &ns, nil
		} else if httpresp.StatusCode == http.StatusConflict {
			return nil, fmt.Errorf("Namespace exists for account %s: %s\n", pid, httpresp.Status)
		} else {
			return nil, fmt.Errorf("Error adding namespace for account %s: %s\n", pid, httpresp.Status)
		}
	}
	return nil, nil
}

func (k *KubeHelper) CreateResourceQuota(pid string, cpu string, mem string) (*api.ResourceQuota, error) {

	glog.V(4).Infof("Creating resource quota for %s: %s, %s\n", pid, cpu, mem)
	rq := api.ResourceQuota{
		TypeMeta: unversioned.TypeMeta{
			APIVersion: "v1",
			Kind:       "ResourceQuota",
		},
		ObjectMeta: api.ObjectMeta{Name: "quota"},
		Spec: api.ResourceQuotaSpec{
			Hard: api.ResourceList{
				api.ResourceCPU:    resource.MustParse(cpu + "m"),
				api.ResourceMemory: resource.MustParse(mem + "M"),
			},
		},
	}

	data, err := json.MarshalIndent(rq, "", "    ")
	if err != nil {
		return nil, err
	}

	fmt.Println(string(data))

	url := k.kubeBase + apiBase + "/namespaces/" + pid + "/resourcequotas"
	request, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	httpresp, httperr := k.client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return nil, httperr
	} else {
		if httpresp.StatusCode == http.StatusCreated {
			glog.V(2).Infof("Added quota %s\n", pid)
			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				return nil, err
			}

			json.Unmarshal(data, &rq)
			return &rq, nil
		} else if httpresp.StatusCode == http.StatusConflict {
			return nil, fmt.Errorf("Quota exists for account %s: %s\n", pid, httpresp.Status)
		} else {
			return nil, fmt.Errorf("Error adding quota for account %s: %s\n", pid, httpresp.Status)
		}
	}
	return nil, nil
}

func (k *KubeHelper) CreateLimitRange(pid string, cpu string, mem string) (*api.LimitRange, error) {

	lr := &api.LimitRange{
		TypeMeta: unversioned.TypeMeta{
			APIVersion: "v1",
			Kind:       "LimitRange",
		},
		ObjectMeta: api.ObjectMeta{
			Name: "limits",
		},
		Spec: api.LimitRangeSpec{
			Limits: []api.LimitRangeItem{
				{
					Type: api.LimitTypeContainer,
					Default: api.ResourceList{
						api.ResourceCPU:    resource.MustParse(cpu + "m"),
						api.ResourceMemory: resource.MustParse(mem + "M"),
					},
				},
			},
		},
	}

	data, err := json.MarshalIndent(lr, "", "    ")
	if err != nil {
		return nil, err
	}

	fmt.Println(string(data))

	url := k.kubeBase + apiBase + "/namespaces/" + pid + "/limitranges"
	request, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	httpresp, httperr := k.client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return nil, httperr
	} else {
		if httpresp.StatusCode == http.StatusCreated {
			glog.V(2).Infof("Added limit range %s\n", pid)
			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				return nil, err
			}

			json.Unmarshal(data, &lr)
			return lr, nil
		} else if httpresp.StatusCode == http.StatusConflict {
			return nil, fmt.Errorf("Quota exists for account %s: %s\n", pid, httpresp.Status)
		} else {
			return nil, fmt.Errorf("Error adding limit range for account %s: %s\n", pid, httpresp.Status)
		}
	}
	return nil, nil
}

func (k *KubeHelper) GetNamespace(pid string) (*api.Namespace, error) {

	url := k.kubeBase + apiBase + "/namespaces/" + pid
	//glog.V(4).Infoln(url)
	request, _ := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	httpresp, httperr := k.client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return nil, httperr
	} else {
		if httpresp.StatusCode == http.StatusOK {
			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				return nil, err
			}

			ns := api.Namespace{}
			json.Unmarshal(data, &ns)
			return &ns, nil
		} else {
			return nil, fmt.Errorf("Error getting namespace for account %s: %s\n", pid, httpresp.Status)
		}
	}
	return nil, nil
}

func (k *KubeHelper) NamespaceExists(pid string) bool {
	ns, _ := k.GetNamespace(pid)
	if ns != nil {
		return true
	} else {
		return false
	}
}

func (k *KubeHelper) DeleteNamespace(pid string) (*api.Namespace, error) {

	url := k.kubeBase + apiBase + "/namespaces/" + pid
	glog.V(4).Infoln(url)
	request, _ := http.NewRequest("DELETE", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	httpresp, httperr := k.client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return nil, httperr
	} else {
		if httpresp.StatusCode == http.StatusOK {
			glog.V(2).Infof("Deleted namespace %s\n", pid)
			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				return nil, err
			}

			ns := api.Namespace{}
			json.Unmarshal(data, &ns)
			return &ns, nil
		} else {
			return nil, fmt.Errorf("Error deleting namespace for account %s: %s\n", pid, httpresp.Status)
		}
	}
	return nil, nil
}

// Start the specified replication controller
func (k *KubeHelper) StartController(pid string, spec *api.ReplicationController) (bool, error) {

	name := spec.Labels["name"]

	// Get ReplicationController spec
	data, err := json.MarshalIndent(spec, "", "    ")
	if err != nil {
		return false, err
	}

	fmt.Println(string(data))

	url := k.kubeBase + apiBase + "/namespaces/" + pid + "/replicationcontrollers"
	request, _ := http.NewRequest("POST", url, bytes.NewBuffer([]byte(data)))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	httpresp, httperr := k.client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return true, httperr
	} else {
		if httpresp.StatusCode == http.StatusCreated {
			glog.V(4).Infof("Created controller " + name)
		} else {
			glog.V(4).Infof("Error starting controller (%d)\n", httpresp.StatusCode)
		}
	}

	// Give Kubernetes time to create the pods for the RC
	time.Sleep(time.Second * 5)

	return true, nil
}

func (k *KubeHelper) StartService(pid string, spec *api.Service) (*api.Service, error) {

	name := spec.Name

	data, err := json.MarshalIndent(spec, "", "    ")
	if err != nil {
		return nil, err
	}
	fmt.Println(string(data))

	url := k.kubeBase + apiBase + "/namespaces/" + pid + "/services"
	request, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	httpresp, httperr := k.client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return nil, httperr
	} else {
		if httpresp.StatusCode == http.StatusCreated {
			glog.V(4).Infof("Created Kubernetes service " + name)

			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				return nil, err
			}

			service := api.Service{}
			json.Unmarshal(data, &service)

			return &service, nil
		} else {
			if httpresp.StatusCode == 409 {
				service, err := k.GetService(pid, name)
				if err != nil {
					return nil, err
				}
				return service, nil
			} else {
				glog.Warningf("Error starting Kubernetes service (%d): %s\n", httpresp.StatusCode, httpresp.Status)
			}
		}
	}

	return nil, nil
}

func (k *KubeHelper) ServiceExists(pid string, name string) bool {
	service, _ := k.GetService(pid, name)
	if service != nil {
		return true
	} else {
		return false
	}
}
func (k *KubeHelper) GetService(pid string, name string) (*api.Service, error) {

	url := k.kubeBase + apiBase + "/namespaces/" + pid + "/services/" + name
	request, _ := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	resp, err := k.client.Do(request)
	if err != nil {
		glog.Error(err)
		return nil, err
	} else {
		if resp.StatusCode == http.StatusOK {
			data, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return nil, err
			}

			service := api.Service{}
			json.Unmarshal(data, &service)
			return &service, nil
		} else {
			//glog.Warningf("Failed to get Kubernetes service %s:%s: %s %d", pid, name,
			//		resp.Status, resp.StatusCode)
		}
	}
	return nil, nil
}

func (k *KubeHelper) GetServices(pid string, stack string) ([]api.Service, error) {

	url := k.kubeBase + apiBase + "/namespaces/" + pid + "/services?labelSelector=stack%3D" + stack
	request, _ := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	resp, err := k.client.Do(request)
	if err != nil {
		glog.Error(err)
		return nil, err
	} else {
		if resp.StatusCode == http.StatusOK {
			data, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return nil, err
			}

			serviceList := api.ServiceList{}
			services := make([]api.Service, len(serviceList.Items))
			json.Unmarshal(data, &serviceList)
			for _, service := range serviceList.Items {
				services = append(services, service)
			}
			return services, nil
		} else {
			glog.Warningf("Failed to get Kubernetes services: %s %d", resp.Status, resp.StatusCode)
		}
	}
	return nil, nil
}
func (k *KubeHelper) GetReplicationControllers(pid string, label string, value string) ([]api.ReplicationController, error) {

	url := k.kubeBase + apiBase + "/namespaces/" + pid + "/replicationcontrollers?labelSelector=" + label + "%3D" + value
	request, _ := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	resp, err := k.client.Do(request)
	if err != nil {
		glog.Error(err)
		return nil, err
	} else {
		if resp.StatusCode == http.StatusOK {
			data, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return nil, err
			}

			rcList := api.ReplicationControllerList{}
			rcs := make([]api.ReplicationController, len(rcList.Items))
			json.Unmarshal(data, &rcList)
			for _, rc := range rcList.Items {
				rcs = append(rcs, rc)
			}
			return rcs, nil
		} else {
			glog.Warningf("Get rcs failed: %s %d", resp.Status, resp.StatusCode)
		}
	}
	return nil, nil
}

func (k *KubeHelper) GetPods(pid string, label string, value string) ([]api.Pod, error) {

	url := k.kubeBase + apiBase + "/namespaces/" + pid + "/pods?labelSelector=" + label + "%3D" + value
	request, _ := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	resp, err := k.client.Do(request)
	if err != nil {
		glog.Error(err)
		return nil, err
	} else {
		if resp.StatusCode == http.StatusOK {
			data, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return nil, err
			}

			podList := api.PodList{}
			pods := make([]api.Pod, len(podList.Items))
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

func (k *KubeHelper) StopService(pid string, name string) error {

	url := k.kubeBase + apiBase + "/namespaces/" + pid + "/services/" + name
	request, _ := http.NewRequest("DELETE", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	httpresp, httperr := k.client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return httperr
	} else {
		if httpresp.StatusCode == http.StatusOK {
			glog.V(4).Infof("Deleted service " + name)
			return nil
		} else {
			glog.V(4).Infof("Error stopping service (%d)\n", httpresp.StatusCode)
			return fmt.Errorf("%s", httpresp.Status)
		}
	}
	return nil
}

func (k *KubeHelper) StopController(pid string, name string) error {

	url := k.kubeBase + apiBase + "/namespaces/" + pid + "/replicationcontrollers/" + name
	request, _ := http.NewRequest("DELETE", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	httpresp, httperr := k.client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return httperr
	} else {
		if httpresp.StatusCode == http.StatusOK {
			glog.V(4).Infof("Deleted controller " + name)
		} else {
			glog.V(4).Infof("Error stopping controller (%d)\n", httpresp.StatusCode)
		}
	}
	rcs, _ := k.GetReplicationControllers(pid, "name", name)
	glog.V(4).Infof("Waiting for rc to terminate %s %d\n", name, len(rcs))
	for len(rcs) > 0 {
		rcs, _ = k.GetReplicationControllers(pid, "name", name)
		time.Sleep(time.Second * 1)
	}

	stopped := map[string]int{}
	pods, _ := k.GetPods(pid, "name", name)
	glog.V(4).Infof("Waiting for pods to terminate %s %d\n", name, len(pods))
	for len(pods) > 0 {
		for _, pod := range pods {
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

	url := k.kubeBase + apiBase + "/namespaces/" + pid + "/pods/" + podName
	request, _ := http.NewRequest("DELETE", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	httpresp, httperr := k.client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return httperr
	} else {
		if httpresp.StatusCode == http.StatusOK {
			glog.V(4).Infof("Deleted pod " + podName)
		} else {
			glog.V(4).Infof("Error stopping pod (%d)\n", httpresp.StatusCode)
			return fmt.Errorf("Error stopping pod (%d)\n", httpresp.StatusCode)
		}
	}
	return nil
}

func (k *KubeHelper) GetLog(pid string, podName string, tailLines int) (string, error) {
	glog.V(4).Infof("Get log for %s %s\n", pid, podName)

	url := k.kubeBase + apiBase + "/namespaces/" + pid + "/pods/" + podName + "/log"

	if tailLines > 0 {
		url += fmt.Sprintf("?tailLines=%d", tailLines)
	}

	glog.V(4).Infoln(url)
	request, _ := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	resp, err := k.client.Do(request)
	if err != nil {
		glog.Error(err)
		return "", err
	} else {
		if resp.StatusCode == http.StatusOK {
			data, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return "", err
			}
			return string(data), nil
		} else {
			glog.Warningf("Failed to get Kubernetes services: %s %d", resp.Status, resp.StatusCode)
		}
	}
	return "", err
}

func (k *KubeHelper) GetPodsStatus(pid string, selector string) (*map[string]string, error) {

	// Get the pods for this stack
	podStatus := make(map[string]string)
	pods, _ := k.GetPods(pid, "rc", selector)
	for _, pod := range pods {
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
	for _, k8service := range k8services {
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

func (k *KubeHelper) CreateServiceTemplate(name string, stack string, spec *ndsapi.ServiceSpec) *api.Service {

	// Create the Kubernetes service definition
	k8svc := api.Service{
		TypeMeta: unversioned.TypeMeta{
			APIVersion: "v1",
			Kind:       "Service",
		},
		ObjectMeta: api.ObjectMeta{
			Name: name,
			Labels: map[string]string{
				"name":    name,
				"stack":   stack,
				"service": spec.Key,
			},
		},
		Spec: api.ServiceSpec{
			Selector: map[string]string{
				"name": name,
			},
		},
	}

	if spec.Access == ndsapi.AccessExternal {
		k8svc.Spec.Type = api.ServiceTypeNodePort
	}

	if len(spec.Ports) > 0 {
		for _, port := range spec.Ports {
			k8port := api.ServicePort{
				Name: fmt.Sprintf("%d", port.Port),
				Port: port.Port,
			}
			// For now, assume all ports are TCP
			k8port.Protocol = api.ProtocolTCP
			k8svc.Spec.Ports = append(k8svc.Spec.Ports, k8port)
		}
	}

	return &k8svc
}

func (k *KubeHelper) CreateControllerTemplate(ns string, name string, stack string, stackService *ndsapi.StackService, spec *ndsapi.ServiceSpec, links *map[string]ServiceAddrPort, sharedEnv *map[string]string) *api.ReplicationController {

	k8rc := api.ReplicationController{}
	// Replication controller
	k8rc.APIVersion = "v1"
	k8rc.Kind = "ReplicationController"
	k8rc.Name = name
	k8rc.Labels = map[string]string{
		"name":    name,
		"stack":   stack,
		"service": spec.Key,
	}

	env := []api.EnvVar{}
	env = append(env, api.EnvVar{Name: "NAMESPACE", Value: ns})
	env = append(env, api.EnvVar{Name: "TERM", Value: "linux"})
	env = append(env, api.EnvVar{Name: "COLUMNS", Value: "100"})
	env = append(env, api.EnvVar{Name: "LINES", Value: "30"})

	for name, addrPort := range *links {

		if addrPort.NodePort > 0 {
			env = append(env,
				api.EnvVar{
					Name:  fmt.Sprintf("%s_NODE_PORT", strings.ToUpper(name)),
					Value: fmt.Sprintf("%d", addrPort.NodePort),
				})
		}

		if name == spec.Key {
			continue
		}

		env = append(env,
			api.EnvVar{
				Name:  fmt.Sprintf("%s_PORT_%d_TCP_ADDR", strings.ToUpper(name), addrPort.Port),
				Value: addrPort.Host,
			})

		env = append(env,
			api.EnvVar{
				Name:  fmt.Sprintf("%s_PORT_%d_TCP_PORT", strings.ToUpper(name), addrPort.Port),
				Value: fmt.Sprintf("%d", addrPort.Port),
			})
	}

	for name, value := range stackService.Config {
		env = append(env, api.EnvVar{Name: name, Value: value})
	}

	for name, value := range *sharedEnv {
		env = append(env, api.EnvVar{Name: name, Value: value})
	}

	k8volMounts := []api.VolumeMount{}

	// Mount the home directory
	k8homeVol := api.VolumeMount{Name: "home", MountPath: "/home/" + ns}
	k8volMounts = append(k8volMounts, k8homeVol)

	if len(spec.VolumeMounts) > 0 {
		for _, vol := range spec.VolumeMounts {
			k8vol := api.VolumeMount{Name: vol.Name, MountPath: vol.MountPath}
			k8volMounts = append(k8volMounts, k8vol)
		}
	}

	k8cps := []api.ContainerPort{}
	if len(spec.Ports) > 0 {
		for _, port := range spec.Ports {
			k8cp := api.ContainerPort{}
			k8cp.ContainerPort = port.Port
			k8cps = append(k8cps, k8cp)
		}
	}

	k8rq := api.ResourceRequirements{}
	if len(spec.ResourceLimits.CPUMax) > 0 && len(spec.ResourceLimits.MemoryMax) > 0 {
		k8rq.Limits = api.ResourceList{
			api.ResourceCPU:    resource.MustParse(spec.ResourceLimits.CPUMax + "m"),
			api.ResourceMemory: resource.MustParse(spec.ResourceLimits.MemoryMax + "M"),
		}
		k8rq.Requests = api.ResourceList{
			api.ResourceCPU:    resource.MustParse(spec.ResourceLimits.CPUDefault + "m"),
			api.ResourceMemory: resource.MustParse(spec.ResourceLimits.MemoryDefault + "M"),
		}
	} else {
		glog.Warningf("No resource requirements specified for service %s\n", spec.Label)
	}

	tag := spec.Image.Tags[0]
	if stackService.ImageTag != "" {
		tag = stackService.ImageTag
	}
	k8template := api.PodTemplateSpec{
		ObjectMeta: api.ObjectMeta{
			Labels: map[string]string{
				"name":    name,
				"stack":   stack,
				"service": spec.Key,
			},
		},
		Spec: api.PodSpec{
			Containers: []api.Container{
				api.Container{
					Name:         spec.Key,
					Image:        spec.Image.Name + ":" + tag,
					Env:          env,
					VolumeMounts: k8volMounts,
					Ports:        k8cps,
					Args:         spec.Args,
					Command:      spec.Command,
					Resources:    k8rq,
				},
			},
			NodeSelector: map[string]string{
				"ndslabs-node-role": "compute",
			},
		},
	}

	if spec.ReadyProbe.Path != "" {
		if spec.ReadyProbe.Type == "http" {
			k8probe := &api.Probe{
				Handler: api.Handler{
					HTTPGet: &api.HTTPGetAction{
						Path:   spec.ReadyProbe.Path,
						Port:   intstr.FromInt(spec.ReadyProbe.Port),
						Scheme: api.URISchemeHTTP,
					},
				},
				InitialDelaySeconds: spec.ReadyProbe.InitialDelay,
				TimeoutSeconds:      spec.ReadyProbe.Timeout,
			}
			k8template.Spec.Containers[0].ReadinessProbe = k8probe
		} else if spec.ReadyProbe.Type == "tcp" {
			k8probe := &api.Probe{
				Handler: api.Handler{
					TCPSocket: &api.TCPSocketAction{
						Port: intstr.FromInt(spec.ReadyProbe.Port),
					},
				},
				InitialDelaySeconds: spec.ReadyProbe.InitialDelay,
				TimeoutSeconds:      spec.ReadyProbe.Timeout,
			}
			k8template.Spec.Containers[0].ReadinessProbe = k8probe
		}
	}

	k8rcs := api.ReplicationControllerSpec{
		Replicas: 1,
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

	for {
		startTime := time.Now()
		url := k.kubeBase + apiBase + "/watch/events"
		request, _ := http.NewRequest("GET", url, nil)
		request.Header.Set("Content-Type", "application/json")
		request.Header.Set("Authorization", k.getAuthHeader())
		httpresp, httperr := k.client.Do(request)
		if httperr != nil {
			glog.Error(httperr)
			return
		} else {
			if httpresp.StatusCode == http.StatusOK {
				reader := bufio.NewReader(httpresp.Body)
				for {
					data, err := reader.ReadBytes('\n')
					if err != nil {
						// EOF error location NDS-372 needs fixing
						//glog.Error(err)
						break
					}

					wevent := watch.WatchEvent{}
					json.Unmarshal(data, &wevent)

					event := api.Event{}

					json.Unmarshal([]byte(wevent.Object.Raw), &event)

					created := event.LastTimestamp
					if created.After(startTime) {

						if event.InvolvedObject.Kind == "Pod" {
							pod, err := k.GetPod(event.InvolvedObject.Namespace, event.InvolvedObject.Name)
							if err != nil {
								glog.Error(err)
							}
							if pod != nil {
								handler.HandlePodEvent(wevent.Type, &event, pod)
							}
						} else if event.InvolvedObject.Kind == "ReplicationController" {
							rc, err := k.GetReplicationController(event.InvolvedObject.Namespace,
								event.InvolvedObject.Name)
							if err != nil {
								glog.Error(err)
							}
							if rc != nil {
								handler.HandleReplicationControllerEvent(wevent.Type, &event, rc)
							}
						}
					}
				}
			}
		}
	}
}

func (k *KubeHelper) WatchPods(handler events.EventHandler) {
	glog.V(4).Infoln("WatchPods started")
	url := k.kubeBase + apiBase + "/watch/pods"

	for {
		request, _ := http.NewRequest("GET", url, nil)
		request.Header.Set("Content-Type", "application/json")
		request.Header.Set("Authorization", k.getAuthHeader())
		httpresp, httperr := k.client.Do(request)
		if httperr != nil {
			glog.Error(httperr)
			return
		} else {
			if httpresp.StatusCode == http.StatusOK {
				reader := bufio.NewReader(httpresp.Body)
				for {
					data, err := reader.ReadBytes('\n')
					if err != nil {
						glog.Error(err)
						break
					}

					wevent := watch.WatchEvent{}
					json.Unmarshal(data, &wevent)

					pod := api.Pod{}

					json.Unmarshal([]byte(wevent.Object.Raw), &pod)

					handler.HandlePodEvent(wevent.Type, nil, &pod)
				}
			}
		}
	}
}

func (k *KubeHelper) GetPod(pid string, name string) (*api.Pod, error) {

	url := k.kubeBase + apiBase + "/namespaces/" + pid + "/pods/" + name
	request, _ := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	resp, err := k.client.Do(request)

	if err != nil {
		glog.Error(err)
		return nil, err
	} else {
		if resp.StatusCode == http.StatusOK {
			data, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				glog.Error(err)
				return nil, err
			}

			pod := api.Pod{}
			json.Unmarshal(data, &pod)
			return &pod, nil
		} else {
			glog.Warningf("Get pod failed (%s): %s %d", name, resp.Status, resp.StatusCode)
		}
	}
	return nil, nil
}

func (k *KubeHelper) GetReplicationController(pid string, name string) (*api.ReplicationController, error) {

	url := k.kubeBase + apiBase + "/namespaces/" + pid + "/replicationcontrollers/" + name
	request, _ := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	resp, err := k.client.Do(request)

	if err != nil {
		glog.Error(err)
		return nil, err
	} else {
		if resp.StatusCode == http.StatusOK {
			data, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				glog.Error(err)
				return nil, err
			}

			rc := api.ReplicationController{}
			json.Unmarshal(data, &rc)
			return &rc, nil
		} else {
			glog.Warningf("Get replicationcontroller failed (%s): %s %d", name, resp.Status, resp.StatusCode)
		}
	}
	return nil, nil
}

func (k *KubeHelper) Exec(pid string, pod string, container string, kube *KubeHelper) *websocket.Handler {

	url, err := url.Parse(k.kubeBase + apiBase + "/namespaces/" + pid + "/pods/" +
		pod + "/exec?container=" + container + "&command=bash&tty=true&stdin=true&stdout=true&stderr=false")
	if err != nil {
		glog.Warning(err)
	}

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

	e, err := remotecommand.NewExecutor(conf, "POST", url)
	if err != nil {
		glog.Warning(err)
	}

	wsHandler := websocket.Handler(func(ws *websocket.Conn) {
		defer ws.Close()

		outr, outw, err := os.Pipe()
		if err != nil {
			glog.Warning(err)
			return
		}
		defer outr.Close()
		defer outw.Close()

		inr, inw, err := os.Pipe()
		if err != nil {
			glog.Fatal(err)
			return
		}
		defer inr.Close()
		defer inw.Close()

		go func() {
			for {

				in := make([]byte, 2048)
				n, err := ws.Read(in)
				if err != nil {
					//glog.Error(err)
					return
				}
				inLen, err := inw.Write(in[:n])
				if err != nil {
					glog.Error(err)
					return
				}
				if inLen < n {
					panic("pty write overflow")
				}
			}
		}()

		go func() {
			for {
				out := make([]byte, 2048)
				n, err := outr.Read(out)
				if err != nil {
					//glog.Error(err)
					return
				}
				_, err = ws.Write(out[:n])
				if err != nil {
					glog.Error(err)
					return
				}
			}
		}()

		err = e.Stream(remotecommandserver.SupportedStreamingProtocols, inr, outw, nil, true)
		if err != nil {
			glog.Error(err)
			return
		}
	})

	return &wsHandler
}

func (k *KubeHelper) CreateIngress(pid string, host string, service string, port int, secretName string) (*extensions.Ingress, error) {

	ingress := extensions.Ingress{
		ObjectMeta: api.ObjectMeta{
			Name:      service + "-ingress",
			Namespace: pid,
		},
		Spec: extensions.IngressSpec{
			TLS: []extensions.IngressTLS{
				extensions.IngressTLS{
					Hosts:      []string{host},
					SecretName: secretName,
				},
			},
			Rules: []extensions.IngressRule{
				extensions.IngressRule{
					Host: host,
					IngressRuleValue: extensions.IngressRuleValue{
						HTTP: &extensions.HTTPIngressRuleValue{
							Paths: []extensions.HTTPIngressPath{
								extensions.HTTPIngressPath{
									Path: "/",
									Backend: extensions.IngressBackend{
										ServiceName: service,
										ServicePort: intstr.FromInt(port),
									},
								},
							},
						},
					},
				},
			},
		},
	}

	data, err := json.Marshal(ingress)
	if err != nil {
		return nil, err
	}

	url := k.kubeBase + extBase + "/namespaces/" + pid + "/ingresses/"
	glog.V(4).Infoln(url)
	request, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	httpresp, httperr := k.client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return nil, httperr
	} else {
		if httpresp.StatusCode == http.StatusCreated {
			glog.V(2).Infof("Added ingress %s-%s\n", pid, service)
			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				return nil, err
			}

			json.Unmarshal(data, &ingress)
			return &ingress, nil
		} else if httpresp.StatusCode == http.StatusConflict {
			return nil, fmt.Errorf("Ingress exists for namespace %s: %s\n", pid, httpresp.Status)
		} else {
			return nil, fmt.Errorf("Error adding ingress for namespace %s: %s\n", pid, httpresp.Status)
		}
	}
	return nil, nil
}

//http://kubernetes.io/docs/api-reference/extensions/v1beta1/operations/
func (k *KubeHelper) DeleteIngress(pid string, name string) (*extensions.Ingress, error) {

	url := k.kubeBase + extBase + "/namespaces/" + pid + "/ingresses/" + name + "-ingress"
	glog.V(4).Infoln(url)
	request, _ := http.NewRequest("DELETE", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	httpresp, httperr := k.client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return nil, httperr
	} else {
		if httpresp.StatusCode == http.StatusOK {
			glog.V(2).Infof("Deleted ingress %s\n", pid)
			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				return nil, err
			}

			ingress := extensions.Ingress{}
			json.Unmarshal(data, &ingress)
			return &ingress, nil
		} else {
			return nil, fmt.Errorf("Error deleting ingress for account %s: %s\n", pid, httpresp.Status)
		}
	}
	return nil, nil
}

func (k *KubeHelper) CreateTLSSecret(pid string, secretName string, tlsCert []byte, tlsKey []byte) (*api.Secret, error) {

	secret := api.Secret{
		ObjectMeta: api.ObjectMeta{
			Name:      secretName,
			Namespace: pid,
		},
		Data: map[string][]byte{
			"tls.crt": tlsCert,
			"tls.key": tlsKey,
		},
	}

	data, err := json.Marshal(secret)
	if err != nil {
		return nil, err
	}
	url := k.kubeBase + apiBase + "/namespaces/" + pid + "/secrets"
	glog.V(4).Infoln(url)
	request, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	httpresp, httperr := k.client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return nil, httperr
	} else {
		if httpresp.StatusCode == http.StatusCreated {
			glog.V(2).Infof("Added secret %s %s\n", pid, secretName)
			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				return nil, err
			}

			json.Unmarshal(data, &secret)
			return &secret, nil
		} else if httpresp.StatusCode == http.StatusConflict {
			return nil, fmt.Errorf("Secret %s exists for account %s: %s\n", secretName, pid, httpresp.Status)
		} else {
			return nil, fmt.Errorf("Error adding secret %s for account %s: %s\n", secretName, pid, httpresp.Status)
		}
	}
	return nil, nil
}

func (k *KubeHelper) DeleteSecret(pid string, name string) (*api.Secret, error) {

	url := k.kubeBase + apiBase + "/namespaces/" + pid + "/secrets/" + name
	glog.V(4).Infoln(url)
	request, _ := http.NewRequest("DELETE", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	httpresp, httperr := k.client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return nil, httperr
	} else {
		if httpresp.StatusCode == http.StatusOK {
			glog.V(2).Infof("Deleted secret %s %s\n", pid, name)
			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				return nil, err
			}

			secret := api.Secret{}
			json.Unmarshal(data, &secret)
			return &secret, nil
		} else {
			return nil, fmt.Errorf("Error deleting secret %s for account %s: %s\n", name, pid, httpresp.Status)
		}
	}
	return nil, nil
}

func (k *KubeHelper) GetSecret(pid string, secretName string) (*api.Secret, error) {

	url := k.kubeBase + apiBase + "/namespaces/" + pid + "/secrets/" + secretName
	glog.V(4).Infoln(url)
	request, _ := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	httpresp, httperr := k.client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return nil, httperr
	} else {
		if httpresp.StatusCode == http.StatusOK {
			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				return nil, err
			}

			secret := api.Secret{}
			json.Unmarshal(data, &secret)
			return &secret, nil
		} else {
			return nil, fmt.Errorf("Error getting secret %s for account %s: %s\n", secretName, pid, httpresp.Status)
		}
	}
	return nil, nil
}

func (k *KubeHelper) GetResourceQuota(pid string) (*api.ResourceQuotaList, error) {

	url := k.kubeBase + apiBase + "/namespaces/" + pid + "/resourcequotas/"
	glog.V(4).Infoln(url)
	request, _ := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", k.getAuthHeader())
	httpresp, httperr := k.client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return nil, httperr
	} else {
		if httpresp.StatusCode == http.StatusOK {
			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				return nil, err
			}

			quota := api.ResourceQuotaList{}
			json.Unmarshal(data, &quota)
			return &quota, nil
		} else {
			return nil, fmt.Errorf("Error getting quota for account %s: %s\n", pid, httpresp.Status)
		}
	}
	return nil, nil
}
