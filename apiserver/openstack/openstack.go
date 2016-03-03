package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"strings"
	"io/ioutil"
	"net/http"
	"os/exec"
)

type OpenStack struct {
	IdentityEndpoint string
	VolumesEndpoint  string
	ComputeEndpoint  string
}

func main() {
	flag.Parse()
	os := OpenStack{}
	os.IdentityEndpoint = "http://nebula.ncsa.illinois.edu:5000/v2.0/"
	os.VolumesEndpoint = "http://nebula.ncsa.illinois.edu:8776/v2/"
	os.ComputeEndpoint = "http://nebula.ncsa.illinois.edu:8774/v2/"
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
		fmt.Printf("Host instanceId: %s\n", instanceId)

		//volumeId, _ := os.CreateVolume(token, tenantId, "nds-test-vol", 10)

		attachments, _ := os.getVolumeAttachments(token, tenantId, instanceId)
		for _, attachment := range attachments {
			fmt.Printf("%s %s\n", attachment.id, attachment.device)
		}	

		volumeId := "d8888f48-8520-47ed-a3e8-8b6a3d639dfa"
		///os.GetVolume(token, tenantId, volumeId)
		// /etc/machine-id
		//mountPoint := "/dev/vdf"
		//os.createVolumeAttachment(token, tenantId, instanceId, volumeId, mountPoint)
		//time.Sleep(time.Second*10)
		//os.GetVolume(token, tenantId, volumeId)
		//os.Mkfs(mountPoint)
		//os.DetachVolume(token, tenantId, volumeId, instanceId)
		//os.GetVolume(token, tenantId, volumeId)
		//attachmentId := "52ba6092-205a-443b-b36c-904b0e689b33"
		os.deleteVolumeAttachment(token, tenantId, instanceId, volumeId)
	}

}

func (s *OpenStack) getInstanceId() (string, error) {
	data, err := ioutil.ReadFile("/etc/machine-id")
	if err != nil {
		return "", err
	}

	machineId := strings.Replace(string(data), "\n", "", -1)
	instanceId := fmt.Sprintf("%s-%s-%s-%s-%s", 
		machineId[0:8],
		machineId[8:12],
		machineId[12:16],
		machineId[16:20],
		machineId[20:len(machineId)])
		
	return instanceId, nil
}

func (s *OpenStack) Mkfs(mountPoint string) {
	//mkfs -t ext4 /dev/vdb
	cmd := exec.Command("mkfs", "-t", "ext4", mountPoint)
	fmt.Println(cmd)
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
				fmt.Print(string(data))

			volumeResp := make(map[string]interface{})
			json.Unmarshal([]byte(data), &volumeResp)
			//fmt.Print(volumeResp)
			volumeMap := volumeResp["volume"].(map[string]interface{})
			id := volumeMap["id"]
			name := volumeMap["name"]
			size := volumeMap["size"]
			fmt.Printf("%s %s %f\n", id, name, size)
		} else {
			fmt.Printf("Error %s\n", httpresp.Status)
		}
	}
}

func (s *OpenStack) AttachVolumeCompute(token string, tenantId string, volumeId string, instanceId string) (bool, error){
	fmt.Printf("Attaching %s to %s\n", volumeId, instanceId)

	attachMap := map[string]interface{}{
		"volumeId": volumeId,
		"device": "/dev/vdb",
	}
	attachObj := map[string]interface{}{"volumeAttachment": attachMap}

	data, _ := json.Marshal(attachObj)
	fmt.Println(string(data))

	client := &http.Client{}
	url := s.ComputeEndpoint + tenantId + "/servers/" + instanceId + "/os-volume_attachments"
	fmt.Println(url)
	request, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Auth-Token", token)
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		fmt.Println(httperr)
		return false, httperr
	} else {
		if httpresp.StatusCode == http.StatusAccepted {
			fmt.Print("Attached \n")
			return true, nil
		} else {
			fmt.Println(httpresp.Status)
			return false, nil
		}
	}
	return false, nil
}

func (s *OpenStack) AttachVolume(token string, tenantId string, volumeId string, instanceId string, mountPoint string) (bool, error){
	fmt.Printf("Attaching %s to %s", volumeId, instanceId)

	attachMap := map[string]interface{}{
		"instance_uuid": instanceId,
		"mountpoint": mountPoint,
	}
	attachObj := map[string]interface{}{"os-attach": attachMap}

	data, _ := json.Marshal(attachObj)
	fmt.Println(string(data))

	client := &http.Client{}
	url := s.VolumesEndpoint + tenantId + "/volumes/" + volumeId + "/action"
	request, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Auth-Token", token)
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		fmt.Println(httperr)
		return false, httperr
	} else {
		if httpresp.StatusCode == http.StatusAccepted {
			fmt.Print("Attached \n")
			return true, nil
		} else {
			fmt.Println(httpresp.Status)
			return false, nil
		}
	}
	return false, nil

}

func (s *OpenStack) DetachVolume(token string, tenantId string, volumeId string, instanceId string) {
	detachMap := map[string]interface{}{
		"instance_uuid": instanceId,
		//"mountpoint": mountPoint,
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

func (s *OpenStack) CreateVolume(token string, tenantId string, name string, size int) (string, error){

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
		return "", httperr
	} else {
		if httpresp.StatusCode == http.StatusAccepted {

			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				fmt.Print(err)
				return "", err
			}

			volumeResp := make(map[string]interface{})
			json.Unmarshal([]byte(data), &volumeResp)
			id := volumeResp["id"]
			name := volumeResp["name"]
			fmt.Printf("%s %s\n", id, name)
			return id.(string), nil
		} else {
			fmt.Println("Error %s\n", httpresp.Status)
		}
	}
	return "", nil
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



type Attachment struct {
	id string
	device string
	serverId string
	volumeId string
}

// DELETE powervc/openstack/compute/v2/{tenant_id}/servers/{server_id}/os-volume_attachments/{attachment_id}
func (s *OpenStack) deleteVolumeAttachment(token string, tenantId string, instanceId string, attachmentId string) {

	client := &http.Client{}
	url := s.ComputeEndpoint + tenantId + "/servers/" + instanceId + "/os-volume_attachments/" + attachmentId
	fmt.Println(url)
	request, _ := http.NewRequest("DELETE", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Auth-Token", token)
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		fmt.Println(httperr)
	} else {
		if httpresp.StatusCode == http.StatusOK {
			fmt.Printf("Deleted %s\n", httpresp.Status)
		} else {
			fmt.Printf("Error %s\n", httpresp.Status)
		}
	}
}


// GET 	powervc/openstack/compute/v2/{tenant_id}/servers/{server_id}/os-volume_attachments
func (s *OpenStack) getVolumeAttachments(token string, tenantId string, instanceId string) ([]Attachment, error ){

	attachments := make([]Attachment,0)
	client := &http.Client{}
	url := s.ComputeEndpoint + tenantId + "/servers/" + instanceId + "/os-volume_attachments"
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
				return attachments, err
			}

			attachResp := make(map[string]interface{})
			json.Unmarshal([]byte(data), &attachResp)
			attachArray := attachResp["volumeAttachments"].([]interface{})
			for _, attach := range attachArray {
				attachment := Attachment{}
				attachment.id = attach.(map[string]interface{})["id"].(string)
				attachment.device = attach.(map[string]interface{})["device"].(string)
				attachment.serverId = attach.(map[string]interface{})["serverId"].(string)
				attachment.volumeId = attach.(map[string]interface{})["volumeId"].(string)
				attachments = append(attachments, attachment)
	
			}

		} else {
			fmt.Println("Error %s\n", httpresp.Status)
		}
	}
	return attachments, nil
}



// POST powervc/openstack/compute/v2/{tenant_id}/servers/{server_id}/os-volume_attachments/{attachment_id}
func (s *OpenStack) createVolumeAttachment(token string, tenantId string, instanceId string, volumeId string, mountPoint string) (error ){
	attachMap := map[string]interface{}{
		"serverId": instanceId,
		"volumeId": volumeId,
		"device": mountPoint,
	}
	attachObj := map[string]interface{}{"volumeAttachment": attachMap}

	data, _ := json.Marshal(attachObj)
	fmt.Println(string(data))

	client := &http.Client{}
	url := s.ComputeEndpoint + tenantId + "/servers/" + instanceId + "/os-volume_attachments"
	request, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Auth-Token", token)
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		fmt.Println(httperr)
	} else {
		if httpresp.StatusCode == http.StatusOK {
			fmt.Printf("Success %s\n", httpresp.Status)
		} else {
			fmt.Printf("Error %s\n", httpresp.Status)
		}
	}
	return  nil
}
