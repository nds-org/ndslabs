package kube_test

import (
	"encoding/json"
	"fmt"
	"github.com/nds-labs/apiserver/kube"
	ndsapi "github.com/nds-labs/apiserver/types"
	"io/ioutil"
	"testing"
)

func TestCreateServiceSpec(t *testing.T) {

	pid := "test"
	stack := "clowder"
	service := "clowder"

	data, _ := ioutil.ReadFile(service + ".json")
	spec := ndsapi.ServiceSpec{}
	json.Unmarshal(data, &spec)

	kube := kube.NewKubeHelper("http://localhost:8080")

	name := kube.GenerateName(stack, spec.Key, 5)

	template := kube.CreateServiceTemplate(name, stack, spec)

	data, err := json.MarshalIndent(&template, "", "    ")
	if err != nil {
		t.Failed()
	}
	fmt.Printf(string(data))

	svc, err := kube.StartService(pid, template)
	if err != nil {
		t.Failed()
	}

	if svc.Spec.ClusterIP == "" {
		t.Failed()
	}
	fmt.Println(svc.Spec.ClusterIP)
	data, err = json.MarshalIndent(&svc, "", "    ")
	if err != nil {
		t.Failed()
	}
	fmt.Printf(string(data))
	err = kube.StopService(pid, name)
	if err != nil {
		t.Failed()
	}
	err = kube.StopService(pid, "test")
	if err == nil {
		t.Failed()
	}

}
