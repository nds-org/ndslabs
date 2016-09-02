// Copyright © 2016 National Data Service
package main

import (
	"bufio"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"k8s.io/kubernetes/pkg/api"
	//"k8s.io/kubernetes/pkg/runtime"
	watch "k8s.io/kubernetes/pkg/watch/json"
	"net/http"
)

func main() {
	client := http.Client{Timeout: 0}
	WatchEvents(client)
}

func WatchEvents(client http.Client) {
	url := "http://localhost:8080/api/v1/watch/events"
	basicAuth := base64.StdEncoding.EncodeToString([]byte("admin:admin"))

	request, _ := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Basic %s", basicAuth))
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		fmt.Println(httperr)
		return
	} else {
		if httpresp.StatusCode == http.StatusOK {
			//scanner := bufio.NewScanner(httpresp.Body)
			//for scanner.Scan() {
			reader := bufio.NewReader(httpresp.Body)
			for {
				data, err := reader.ReadBytes('\n')
				if err != nil {
					fmt.Println(err)
				}

				wevent := watch.WatchEvent{}
				json.Unmarshal(data, &wevent)
				//json.Unmarshal(scanner.Bytes(), &event)

				event := api.Event{}

				json.Unmarshal([]byte(wevent.Object.Raw), &event)
				fmt.Printf("\tType=%s\n", event.Type)
				fmt.Printf("\tReason=%s\n", event.Reason)
				fmt.Printf("\tMessage=%s\n", event.Message)
				fmt.Printf("\tInvolvedObject:\n")
				fmt.Printf("\t\tKind: %s\n", event.InvolvedObject.Kind)
				fmt.Printf("\t\tName: %s\n", event.InvolvedObject.Name)
				fmt.Printf("\t\tNamespace: %s\n", event.InvolvedObject.Namespace)

				if event.InvolvedObject.Kind == "Pod" {
					pod, err := GetPod(client, event.InvolvedObject.Namespace, event.InvolvedObject.Name)
					if err != nil {
						fmt.Println(err)
					}
					fmt.Printf("\t\ttype=%s\n", event.Type)
					fmt.Printf("\t\tstack=%s\n", pod.ObjectMeta.Labels["stack"])
					fmt.Printf("\t\tphase=%s\n", pod.Status.Phase)
					if len(pod.Status.Conditions) > 0 {
						fmt.Printf("\t\t%s %s\n", pod.Status.Conditions[0].Type, pod.Status.Conditions[0].Status)
					}
				}
			}
		}
	}
}

func WatchPods(client http.Client) {
	url := "http://localhost:8080/api/v1/watch/pods"
	basicAuth := base64.StdEncoding.EncodeToString([]byte("admin:admin"))

	request, _ := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Basic %s", basicAuth))
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		fmt.Println(httperr)
		return
	} else {
		if httpresp.StatusCode == http.StatusOK {
			//scanner := bufio.NewScanner(httpresp.Body)
			//for scanner.Scan() {
			reader := bufio.NewReader(httpresp.Body)
			for {
				data, err := reader.ReadBytes('\n')
				if err != nil {
					fmt.Println(err)
				}

				event := watch.WatchEvent{}
				json.Unmarshal(data, &event)
				//json.Unmarshal(scanner.Bytes(), &event)

				pod := api.Pod{}

				json.Unmarshal([]byte(event.Object.Raw), &pod)
				fmt.Printf("%s/%s\n", pod.ObjectMeta.Namespace, pod.Name)
				fmt.Printf("\ttype=%s\n", event.Type)
				fmt.Printf("\tstack=%s\n", pod.ObjectMeta.Labels["stack"])
				fmt.Printf("\tphase=%s\n", pod.Status.Phase)
				if len(pod.Status.Conditions) > 0 {
					fmt.Printf("\t%s %s\n", pod.Status.Conditions[0].Type, pod.Status.Conditions[0].Status)
				}
			}
			fmt.Println("Scan ended\n")
		}
	}
}

func GetPod(client http.Client, pid string, name string) (*api.Pod, error) {

	url := "http://localhost:8080/api/v1/namespaces/" + pid + "/pods/" + name
	basicAuth := base64.StdEncoding.EncodeToString([]byte("admin:admin"))

	request, _ := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Basic %s", basicAuth))
	resp, err := client.Do(request)
	if err != nil {
		fmt.Println(err)
		return nil, err
	} else {
		if resp.StatusCode == http.StatusOK {
			data, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return nil, err
			}

			pod := api.Pod{}
			json.Unmarshal(data, &pod)
			return &pod, nil
		} else {
			fmt.Printf("Get pods failed: %s %d", resp.Status, resp.StatusCode)
		}
	}
	return nil, nil
}
