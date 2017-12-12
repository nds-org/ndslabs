package kube

import (
	"encoding/json"
	"fmt"
	ndsapi "github.com/ndslabs/apiserver/pkg/types"
	"io/ioutil"
	"testing"
	"k8s.io/client-go/pkg/api/v1"
	"k8s.io/client-go/kubernetes/fake"
	)

func TestCreateServiceSpec(t *testing.T) {

	//pid := "test"
	//stack := "clowder"
	service := "clowder"

	obj := &v1.Service{ObjectMeta: v1.ObjectMeta{Name: "foo", Namespace: v1.NamespaceDefault}}
	clientSet := fake.NewSimpleClientset(obj)

	data, _ := ioutil.ReadFile(service + ".json")
	spec := ndsapi.ServiceSpec{}
	json.Unmarshal(data, &spec)

	testKube  := KubeHelper{
		"",
		nil,
		"",
		"",
		"",
		clientSet,
	}


	name := testKube.GenerateName( 5)
	fmt.Print(name)

	//template := testKube.CreateServiceTemplate(name, stack, spec)
	//
	//data, err := json.MarshalIndent(&template, "", "    ")
	//if err != nil {
	//	t.Failed()
	//}
	//fmt.Printf(string(data))
	//
	//svc, err := kube.StartService(pid, template)
	//if err != nil {
	//	t.Failed()
	//}
	//
	//if svc.Spec.ClusterIP == "" {
	//	t.Failed()
	//}
	//fmt.Println(svc.Spec.ClusterIP)
	//data, err = json.MarshalIndent(&svc, "", "    ")
	//if err != nil {
	//	t.Failed()
	//}
	//fmt.Printf(string(data))
	//err = kube.StopService(pid, name)
	//if err != nil {
	//	t.Failed()
	//}
	//err = kube.StopService(pid, "test")
	//if err == nil {
	//	t.Failed()
	//}

}
