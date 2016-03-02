package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"net/http"
	"os/exec"
)

type OpenStack struct {
	IdentityEndpoint string
	VolumesEndpoint  string
}

func main() {
	flag.Parse()
	os := OpenStack{}
	os.IdentityEndpoint = "http://nebula.ncsa.illinois.edu:5000/v2.0/"
	os.VolumesEndpoint = "http://nebula.ncsa.illinois.edu:8776/v2/"
	username := ""
	password := ""
	tenantId := ""

	token, _ := os.Authenticate(username, password, tenantId)
	/*
		vols, _ := os.ListVolumes(tenantId, token)
		for id, name := range vols {
			fmt.Printf("%s %s\n", id, name)
		}
	*/

	instanceId, err := os.getInstanceId()
	if err == nil {

		//os.CreateVolume(token, tenantId, "nds-test-vol", 10)
		volumeId := ""
		os.GetVolume(token, tenantId, volumeId)
		// /etc/machine-id
		mountPoint := "/dev/nds0"

		os.AttachVolume(token, tenantId, volumeId, instanceId, mountPoint)
		os.Mkfs(mountPoint)
		os.DetachVolume(token, tenantId, volumeId, instanceId, mountPoint)
	}

}

func (s *OpenStack) getInstanceId() (string, error) {
	data, err := ioutil.ReadFile("/etc/machine-id")
	if err != nil {
		return "", err
	}

	return string(data), nil
}

func (s *OpenStack) Mkfs(mountPoint string) {
	//mkfs -t ext4 /dev/vdb
	cmd := exec.Command("mkfs", "-t", "ext4", mountPoint)
	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()
	if err != nil {
		fmt.Print(err)
	}
	fmt.Printf("mkfs response: %s\n", out.String())
}

func (s *OpenStack) GetVolume(token string, tenantId string, volumeId string) {
	client := &http.Client{}
	url := s.VolumesEndpoint + tenantId + "/volumes/" + volumeId
	//fmt.Println(url)
	request, _ := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Auth-Token", token)
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		fmt.Println(httperr)
	} else {
		if httpresp.StatusCode == http.StatusOK {

			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				fmt.Print(err)
			}
			//	fmt.Print(string(data))

			volumeResp := make(map[string]interface{})
			json.Unmarshal([]byte(data), &volumeResp)
			volumeMap := volumeResp["volume"].(map[string]interface{})
			id := volumeMap["id"]
			name := volumeMap["name"]
			size := volumeMap["size"]
			fmt.Printf("%s %s %f\n", id, name, size)
		} else {
			fmt.Println("Error %s\n", httpresp.Status)
		}
	}
}

func (s *OpenStack) AttachVolume(token string, tenantId string, volumeId string, instanceId string, mountPoint string) {
	attachMap := map[string]interface{}{
		"instance_uuid": instanceId,
		"mountpoint":    mountPoint,
	}
	attachObj := map[string]interface{}{"os-attach": attachMap}

	data, _ := json.Marshal(attachObj)

	client := &http.Client{}
	url := s.VolumesEndpoint + tenantId + "/volumes/" + volumeId + "/action"
	request, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Auth-Token", token)
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		fmt.Println(httperr)
	} else {
		if httpresp.StatusCode == http.StatusAccepted {
			fmt.Print("Attached \n")
		} else {
			fmt.Print(httpresp.Status)
		}
	}

}

func (s *OpenStack) DetachVolume(token string, tenantId string, volumeId string, instanceId string, mountPoint string) {
	detachMap := map[string]interface{}{
		"instance_uuid": instanceId,
		"mountpoint":    mountPoint,
	}
	detachObj := map[string]interface{}{"os-detach": detachMap}

	data, _ := json.Marshal(detachObj)

	client := &http.Client{}
	url := s.VolumesEndpoint + tenantId + "/volumes/" + volumeId + "/action"
	request, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Auth-Token", token)
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		fmt.Println(httperr)
	} else {
		if httpresp.StatusCode == http.StatusAccepted {
			fmt.Print("Detached \n")
		} else {
			fmt.Print(httpresp.Status)
		}
	}
}

func (s *OpenStack) CreateVolume(token string, tenantId string, name string, size int) {

	volumeMap := map[string]interface{}{
		"size":        size,
		"name":        name,
		"multiattach": false,
	}
	volumeObj := map[string]interface{}{"volume": volumeMap}

	data, _ := json.Marshal(volumeObj)
	fmt.Print(string(data))

	client := &http.Client{}
	url := s.VolumesEndpoint + tenantId + "/volumes"
	request, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Auth-Token", token)
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		fmt.Println(httperr)
	} else {
		if httpresp.StatusCode == http.StatusOK {

			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				fmt.Print(err)
			}

			volumeResp := make(map[string]interface{})
			json.Unmarshal([]byte(data), &volumeResp)
			id := volumeResp["id"]
			name := volumeResp["name"]
			fmt.Printf("%s %s\n", id, name)
		} else {
			fmt.Println("Error %s\n", httpresp.Status)
		}
	}
}

func (s *OpenStack) ListVolumes(tenantId string, token string) (map[string]string, error) {

	volumes := make(map[string]string)
	client := &http.Client{}
	url := s.VolumesEndpoint + tenantId + "/volumes"
	request, _ := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Auth-Token", token)
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		fmt.Println(httperr)
	} else {
		if httpresp.StatusCode == http.StatusOK {

			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				return volumes, err
			}

			volumeResp := make(map[string]interface{})
			json.Unmarshal([]byte(data), &volumeResp)
			volumesArray := volumeResp["volumes"].([]interface{})
			for _, vol := range volumesArray {
				id := vol.(map[string]interface{})["id"]
				name := vol.(map[string]interface{})["name"]
				if name == nil {
					volumes[id.(string)] = ""
				} else {
					volumes[id.(string)] = name.(string)
				}
			}

		} else {
			fmt.Println("Error %s\n", httpresp.Status)
		}
	}
	return volumes, nil
}

func (s *OpenStack) Authenticate(username string, password string, tenantId string) (string, error) {

	fmt.Printf("Authenticate %s %s\n", username, tenantId)
	client := &http.Client{}

	authMap := make(map[string]interface{})
	authMap["passwordCredentials"] = map[string]interface{}{
		"username": username,
		"password": password,
	}
	authMap["tenantId"] = tenantId
	authObj := map[string]interface{}{"auth": authMap}

	data, _ := json.Marshal(authObj)
	//fmt.Println(string(data))
	url := s.IdentityEndpoint + "/tokens"
	//fmt.Println(url)
	request, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		fmt.Println(httperr)
		return "", httperr
	} else {
		if httpresp.StatusCode == http.StatusOK {

			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				return "", err
			}
			tokenResp := make(map[string]interface{})
			json.Unmarshal([]byte(data), &tokenResp)
			tokenMap := tokenResp["access"].(map[string]interface{})["token"].(map[string]interface{})
			token := tokenMap["id"].(string)
			return token, nil
		} else {
			fmt.Println("Error %s\n", httpresp.Status)
		}
	}
	return "", nil
}
