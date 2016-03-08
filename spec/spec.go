package main

import (
	"encoding/json"
	"flag"
	"fmt"
	api "github.com/nds-labs/apiserver/types"
	"io/ioutil"
	k8api "k8s.io/kubernetes/pkg/api"
	"k8s.io/kubernetes/pkg/api/unversioned"
	intstr "k8s.io/kubernetes/pkg/util/intstr"
	utilrand "k8s.io/kubernetes/pkg/util/rand"
	"time"
)

func main() {

	//pid := "demo"

	flag.Parse()
	stackKey := flag.Arg(0)
	stackService := flag.Arg(1)

	fmt.Printf("Reading spec %s\n", stackService)
	data, _ := ioutil.ReadFile(stackService + ".json")
	spec := api.ServiceSpec{}
	json.Unmarshal(data, &spec)

	stackName := generateName(stackKey, spec.Key, 5)

	k8svc := createServiceTemplate(stackName, stackKey, spec)
	data, _ = json.MarshalIndent(k8svc, "", "    ")
	fmt.Println(string(data))

	// MONGO_PORT_27017_TCP_ADDR
	// MONGO_PORT_27017_TCP_PORT
	links := map[string]string{
		"MONGO_SERVICE_HOST":       "10.0.0.1",
		"MONGO_SERVICE_27017_PORT": "27017",
	}

	k8rc := createReplicationControllerTemplate(stackName, stackKey, spec, links)
	data, _ = json.MarshalIndent(k8rc, "", "    ")
	fmt.Println(string(data))

	// Each of the dependent RCs need to know about the
	// services they depend on.
	// 1. Create service spec
	// 2. Create services
	// 3. Get the list of service IP and port
	// 4. Create RCs giving service IP/port as
	// 2. Create RCs giving as input the list of dependent services

}

func generateName(stack string, service string, randomLength int) string {
	return fmt.Sprintf("%s-%s-%s", stack, service, utilrand.String(randomLength))
}

func createServiceTemplate(stackName string, stackKey string, spec api.ServiceSpec) *k8api.Service {

	k8svc := k8api.Service{}

	// Create the Kubernetes service definition
	k8svc.APIVersion = "v1"
	k8svc.Kind = "Service"
	k8svc.Name = stackName
	k8svc.CreationTimestamp = unversioned.Time{time.Now()}
	k8svc.Labels = map[string]string{
		"name":    stackName,
		"stack":   stackKey,
		"service": spec.Key,
	}

	k8svc.Spec.Selector = map[string]string{
		"name": stackName,
	}

	if spec.IsService {
		k8svc.Spec.Type = k8api.ServiceTypeNodePort
	}

	if len(spec.Ports) > 0 {
		for _, port := range spec.Ports {
			k8port := k8api.ServicePort{}
			k8port.Name = fmt.Sprintf("%d", port.Port)
			k8port.Port = port.Port
			if port.Protocol == "TCP" {
				k8port.Protocol = k8api.ProtocolTCP
			}
			k8svc.Spec.Ports = append(k8svc.Spec.Ports, k8port)
		}
	}

	return &k8svc
}

func createReplicationControllerTemplate(stackName string, stackKey string, spec api.ServiceSpec,
	links map[string]string) *k8api.ReplicationController {

	k8rc := k8api.ReplicationController{}
	// Replication controller
	k8rc.APIVersion = "v1"
	k8rc.Kind = "ReplicationController"
	k8rc.CreationTimestamp = unversioned.Time{time.Now()}
	k8rc.Name = stackName
	k8rc.Labels = map[string]string{
		"name":    stackName,
		"stack":   stackKey,
		"service": spec.Key,
	}

	k8rcs := k8api.ReplicationControllerSpec{}
	k8rcs.Replicas = 1
	k8rcs.Selector = map[string]string{
		"name": stackName,
	}

	env := []k8api.EnvVar{}
	for name, value := range spec.Config {
		env = append(env, k8api.EnvVar{Name: name, Value: value})
	}

	for name, value := range links {
		env = append(env, k8api.EnvVar{Name: name, Value: value})
	}

	k8volMounts := []k8api.VolumeMount{}
	if len(spec.VolumeMounts) > 0 {
		for _, vol := range spec.VolumeMounts {
			k8vol := k8api.VolumeMount{Name: vol.Name, MountPath: vol.MountPath}
			k8volMounts = append(k8volMounts, k8vol)
		}
	}

	k8cps := []k8api.ContainerPort{}
	if len(spec.Ports) > 0 {
		for _, port := range spec.Ports {
			k8cp := k8api.ContainerPort{}
			k8cp.ContainerPort = port.Port
			k8cps = append(k8cps, k8cp)
		}
	}

	k8template := k8api.PodTemplateSpec{}
	k8template.Labels = map[string]string{
		"name":    stackName,
		"stack":   stackKey,
		"service": spec.Key,
	}
	k8template.Spec = k8api.PodSpec{
		Containers: []k8api.Container{
			k8api.Container{
				Name:         spec.Key,
				Image:        spec.Image,
				Env:          env,
				VolumeMounts: k8volMounts,
				Ports:        k8cps,
			},
		},
	}

	if spec.ReadyProbe.Path != "" {
		k8probe := &k8api.Probe{
			Handler: k8api.Handler{
				HTTPGet: &k8api.HTTPGetAction{
					Path:   spec.ReadyProbe.Path,
					Port:   intstr.FromInt(spec.ReadyProbe.Port),
					Scheme: k8api.URISchemeHTTP,
				},
			},
			InitialDelaySeconds: spec.ReadyProbe.InitialDelay,
			TimeoutSeconds:      spec.ReadyProbe.Timeout,
		}
		k8template.Spec.Containers[0].ReadinessProbe = k8probe
	}

	k8rcs.Template = &k8template

	k8rc.Spec = k8rcs
	return &k8rc
}
