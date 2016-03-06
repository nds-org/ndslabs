package main

import (
	"encoding/json"
	"fmt"
	"github.com/nds-labs/apiserver/kube"
	ndsapi "github.com/nds-labs/apiserver/types"
	"io/ioutil"
)

func main() {

	kube := kube.NewKubeHelper("http://localhost:8080")

	pid := "test"

	stack := getTestStack(kube)
	startStack(pid, stack, kube)
}

func startStack(pid string, stack *ndsapi.Stack, k *kube.KubeHelper) {

	// Start the services -- this way we have access to the services and ports
	addrPortMap := startServices(pid, stack, k)
	for key, value := range addrPortMap {
		fmt.Printf("\t%s %s %s %d\n", key, value.Name, value.Host, value.Port)
	}

	// Not, start the controllers -- pass the addrPortMap to create links
	// during template creation
	startControllers(pid, stack, addrPortMap, k)

	//stopControllers(pid, stack, k)
	//stopServices(pid, stack, k)

	// Get the spec for the primary service
	/*
		spec := getSpec(stack.Key)
		for _, dep := range spec.Dependencies {
			if dep.Required {
			}
		}
	*/
}

func startControllers(pid string, stack *ndsapi.Stack, addrPortMap map[string]kube.ServiceAddrPort, k *kube.KubeHelper) {

	for _, ssvc := range stack.Services {
		spec := getSpec(ssvc.Service)
		name := fmt.Sprintf("%s-%s", stack.Id, spec.Key)
		template := k.CreateControllerTemplate(name, stack.Id, spec, addrPortMap)
		fmt.Printf("Starting controller %s\n", name)
		k.StartController(pid, template)
	}
}

func stopServices(pid string, stack *ndsapi.Stack, k *kube.KubeHelper) {

	for _, ssvc := range stack.Services {
		name := fmt.Sprintf("%s-%s", stack.Id, ssvc.Service)
		fmt.Printf("Stopping service %s\n", name)
		k.StopService(pid, name)
	}
}

func stopControllers(pid string, stack *ndsapi.Stack, k *kube.KubeHelper) {

	for _, ssvc := range stack.Services {
		name := fmt.Sprintf("%s-%s", stack.Id, ssvc.Service)
		fmt.Printf("Stopping controller %s\n", name)
		k.StopController(pid, name)
	}
}

func startServices(pid string, stack *ndsapi.Stack, k *kube.KubeHelper) map[string]kube.ServiceAddrPort {

	addrPortMap := make(map[string]kube.ServiceAddrPort)
	for _, ssvc := range stack.Services {
		spec := getSpec(ssvc.Service)
		name := fmt.Sprintf("%s-%s", stack.Id, spec.Key)
		template := k.CreateServiceTemplate(name, stack.Id, spec)
		svc, err := k.StartService(pid, template)
		if err != nil {
			fmt.Println("Error starting service")
		} else {
			fmt.Printf("Started service %s\n", name)
			addrPort := kube.ServiceAddrPort{
				Name: ssvc.Service,
				Host: svc.Spec.ClusterIP,
				Port: svc.Spec.Ports[0].Port,
			}
			addrPortMap[ssvc.Service] = addrPort
		}
	}
	return addrPortMap
}

func getSpec(service string) *ndsapi.ServiceSpec {
	data, _ := ioutil.ReadFile(service + ".json")
	spec := ndsapi.ServiceSpec{}
	json.Unmarshal(data, &spec)
	return &spec
}

func getTestStack(k *kube.KubeHelper) *ndsapi.Stack {
	stack := "clowder"
	mystack := ndsapi.Stack{}
	mystack.Id = k.GenerateName(stack, 5)
	mystack.Key = stack
	mystack.Name = "myname"

	mystack.Services = append(mystack.Services, ndsapi.StackService{Stack: stack, Service: "clowder"})
	mystack.Services = append(mystack.Services, ndsapi.StackService{Stack: stack, Service: "mongo"})
	return &mystack
}

/*
func test(pid string, service string, stack string) {
	data, _ := ioutil.ReadFile(service + ".json")
	spec := ndsapi.ServiceSpec{}
	json.Unmarshal(data, &spec)

	k := kube.NewKubeHelper("http://localhost:8080")

	name := k.GenerateName(stack, spec.Key, 5)

	template := k.CreateServiceTemplate(name, stack, &spec)

	data, err := json.MarshalIndent(&template, "", "    ")
	if err != nil {
	}
	fmt.Printf(string(data))

	svc, err := k.StartService(pid, template)
	if err != nil {
	}

	if svc.Spec.ClusterIP == "" {
	}
	fmt.Println(svc.Spec.ClusterIP)
	data, err = json.MarshalIndent(&svc, "", "    ")
	if err != nil {
	}
	fmt.Printf(string(data))
	err = k.StopService(pid, name)
	if err != nil {
	}
	err = k.StopService(pid, "test")
	if err == nil {
	}

}
*/
