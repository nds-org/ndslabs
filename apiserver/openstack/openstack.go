package openstack

import (
	"bytes"
	"encoding/json"
	"github.com/golang/glog"
	"fmt"
	"io/ioutil"
	"net/http"
	"os/exec"
	"strings"
	"time"
)

type Token struct {
	Id      string
	Expires time.Time
}

type Volume struct {
	Id       string
	Name     string
	Device   string
	ServerId string
	Size     int
	Status     string
}

type Attachment struct {
	Id       string
	Device   string
	ServerId string
	VolumeId string
}

type OpenStack struct {
	IdentityEndpoint string
	VolumesEndpoint  string
	ComputeEndpoint  string
	Username         string
	Password         string
	TenantId         string
}

// OpenStack client for NDS Labs


// Returns the local host instanceId
func (s *OpenStack) GetInstanceId() (string, error) {
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

func (s *OpenStack) Mkfs(mountPoint string, fstype string) error {
	glog.Infof("Mkfs %s %s\n", mountPoint, fstype)
	cmd := exec.Command("mkfs", "-t", fstype, mountPoint)
	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()
	if err != nil {
		glog.Error(err)
		glog.Errorf("Stdout: %s\n", out.String())
		return err
	}
	return nil
}

func (s *OpenStack) GetVolume(token string, tenantId string, volumeId string) (*Volume, error) {
	client := &http.Client{}
	url := s.VolumesEndpoint + tenantId + "/volumes/" + volumeId
	//fmt.Println(url)
	request, _ := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Auth-Token", token)
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		return nil, httperr
	} else {
		if httpresp.StatusCode == http.StatusOK {

			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				return nil, err
			}

			volume := Volume{}

			volumeResp := make(map[string]interface{})
			json.Unmarshal([]byte(data), &volumeResp)
			//fmt.Print(volumeResp)
			volumeMap := volumeResp["volume"].(map[string]interface{})

			volume.Id = volumeMap["id"].(string)
			volume.Name = volumeMap["name"].(string)
			volume.Size = int(volumeMap["size"].(float64))
			volume.Status = volumeMap["status"].(string)
			glog.V(4).Infof("GetVolume status=%s\n", volume.Status)

			attachments := volumeMap["attachments"].([]interface{})
			if attachments != nil && len(attachments) > 0 {
				attachMap := attachments[0].(map[string]interface{})
				volume.ServerId = attachMap["server_id"].(string)
				volume.Device = attachMap["device"].(string)
			}
			return &volume, nil
		} else {
			fmt.Printf("Error %s\n", httpresp.Status)
		}
	}
	return nil, nil
}

func (s *OpenStack) CreateVolume(token string, tenantId string, name string, size int) (string, error) {
	glog.Infof("CreateVolume %s %d\n", name, size)

	volumeMap := map[string]interface{}{
		"size":        size,
		"name":        name,
		"multiattach": false,
	}
	volumeObj := map[string]interface{}{"volume": volumeMap}

	data, _ := json.Marshal(volumeObj)

	client := &http.Client{}
	url := s.VolumesEndpoint + tenantId + "/volumes"
	request, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Auth-Token", token)
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return "", httperr
	} else {
		if httpresp.StatusCode == http.StatusAccepted {

			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				glog.Error(err)
				return "", err
			}

			volumeResp := make(map[string]interface{})
			json.Unmarshal([]byte(data), &volumeResp)
			volumeMap := volumeResp["volume"].(map[string]interface{})
			id := volumeMap["id"]
			glog.V(4).Infof("Created volume %s\n", id)
			return id.(string), nil
		} else {
			err := fmt.Errorf("Error %s\n", httpresp.Status)
			glog.Error(err)
			return "", err
		}
	}
	return "", nil
}

func (s *OpenStack) ListVolumes(tenantId string, token string) ([]Volume, error) {

	volumes := make([]Volume, 0)

	client := &http.Client{}
	url := s.VolumesEndpoint + tenantId + "/volumes"
	request, _ := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Auth-Token", token)
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		return volumes, httperr
	} else {
		if httpresp.StatusCode == http.StatusOK {

			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				return volumes, err
			}

			// Parse the response
			volumeResp := make(map[string]interface{})
			json.Unmarshal([]byte(data), &volumeResp)
			volumesArray := volumeResp["volumes"].([]interface{})
			for _, vol := range volumesArray {
				volume := Volume{}
				volume.Id = vol.(map[string]interface{})["id"].(string)
				name := vol.(map[string]interface{})["name"]
				if name != nil {
					volume.Name = name.(string)
				}
				volumes = append(volumes, volume)
			}
		} else {
			fmt.Println("Error %s\n", httpresp.Status)
		}
	}
	return volumes, nil
}

func (s *OpenStack) Authenticate(username string, password string, tenantId string) (*Token, error) {

	glog.V(4).Infof("Authenticate %s %s\n", username, tenantId)
	client := &http.Client{}

	authMap := make(map[string]interface{})
	authMap["passwordCredentials"] = map[string]interface{}{
		"username": username,
		"password": password,
	}
	authMap["tenantId"] = tenantId
	authObj := map[string]interface{}{"auth": authMap}

	data, _ := json.Marshal(authObj)
	url := s.IdentityEndpoint + "/tokens"

	request, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return nil, httperr
	} else {
		if httpresp.StatusCode == http.StatusOK {

			data, err := ioutil.ReadAll(httpresp.Body)
			if err != nil {
				return nil, err
			}
			tokenResp := make(map[string]interface{})
			json.Unmarshal([]byte(data), &tokenResp)
			tokenMap := tokenResp["access"].(map[string]interface{})["token"].(map[string]interface{})

			token := Token{}
			token.Id = tokenMap["id"].(string)
			token.Expires, err = time.Parse(time.RFC3339, tokenMap["expires"].(string))
			if err != nil {
				return nil, err
			}

			return &token, nil
		} else {
			err := fmt.Errorf("Error %s\n", httpresp.Status)
			glog.Error(err)
			return nil, err
		}
	}
	return nil, nil
}

// DELETE powervc/openstack/compute/v2/{tenant_id}/servers/{server_id}/os-volume_attachments/{attachment_id}
func (s *OpenStack) DetachVolume(token string, tenantId string, instanceId string, attachmentId string) error {

	glog.V(4).Infof("DetachVolume %s %s\n", instanceId, attachmentId)
	client := &http.Client{}
	url := s.ComputeEndpoint + tenantId + "/servers/" + instanceId + "/os-volume_attachments/" + attachmentId
	//glog.V(4).Infof("Detach URL: %s\n", url)
	request, _ := http.NewRequest("DELETE", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Auth-Token", token)
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
		return httperr
	} else {
		if httpresp.StatusCode == http.StatusAccepted {
			glog.V(4).Infoln("Detach succeeded")
		} else {
			err := fmt.Errorf("Detach failed %s\n", httpresp.Status)
			glog.Error(err)
			return err
		}
	}
	return nil
}

// GET 	powervc/openstack/compute/v2/{tenant_id}/servers/{server_id}/os-volume_attachments
func (s *OpenStack) GetVolumeAttachments(token string, tenantId string, instanceId string) ([]Attachment, error) {

	attachments := make([]Attachment, 0)
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

			fmt.Println(string(data))
			attachResp := make(map[string]interface{})
			json.Unmarshal([]byte(data), &attachResp)
			attachArray := attachResp["volumeAttachments"].([]interface{})
			for _, attach := range attachArray {
				attachment := Attachment{}
				attachment.Id = attach.(map[string]interface{})["id"].(string)
				attachment.Device = attach.(map[string]interface{})["device"].(string)
				attachment.ServerId = attach.(map[string]interface{})["serverId"].(string)
				attachment.VolumeId = attach.(map[string]interface{})["volumeId"].(string)
				attachments = append(attachments, attachment)

			}

		} else {
			fmt.Println("Error %s\n", httpresp.Status)
		}
	}
	return attachments, nil
}

// POST powervc/openstack/compute/v2/{tenant_id}/servers/{server_id}/os-volume_attachments/{attachment_id}
func (s *OpenStack) AttachVolume(token string, tenantId string, instanceId string, volumeId string) error {
	glog.V(4).Infof("Attaching volume %s, %s, %s, %s\n", token, tenantId, instanceId, volumeId)
	attachMap := map[string]interface{}{
		"serverId": instanceId,
		"volumeId": volumeId,
	}
	attachObj := map[string]interface{}{"volumeAttachment": attachMap}

	data, _ := json.Marshal(attachObj)

	client := &http.Client{}
	url := s.ComputeEndpoint + tenantId + "/servers/" + instanceId + "/os-volume_attachments"

	request, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Auth-Token", token)
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		glog.Error(httperr)
	} else {
		if httpresp.StatusCode == http.StatusOK {
			glog.V(4).Infoln("Attach succeeded")
		} else {
			err := fmt.Errorf("Attach failed %s\n", httpresp.Status)
			glog.Error(err)
			return err
		}
	}
	return nil
}

func (s *OpenStack) DeleteVolume(token string, tenantId string, volumeId string) error {

	client := &http.Client{}
	url := s.VolumesEndpoint + tenantId + "/volumes/" + volumeId
	request, _ := http.NewRequest("DELETE", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Auth-Token", token)
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		return httperr
	} else {
		if httpresp.StatusCode == http.StatusAccepted {
			fmt.Printf("Success %s\n", httpresp.Status)
			return nil
		} else {
			fmt.Printf("Error %s\n", httpresp.Status)
			return nil
		}
	}
	return nil
}
