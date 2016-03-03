package openstack

import (
	"bytes"
	"encoding/json"
	//"flag"
	"fmt"
	"io/ioutil"
	"net/http"
	//sys "os"
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
}

type Attachment struct {
	id       string
	device   string
	serverId string
	volumeId string
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

/*
func main() {
	flag.Parse()
	os := OpenStack{}
	os.IdentityEndpoint = "http://nebula.ncsa.illinois.edu:5000/v2.0/"
	os.VolumesEndpoint = "http://nebula.ncsa.illinois.edu:8776/v2/"
	os.ComputeEndpoint = "http://nebula.ncsa.illinois.edu:8774/v2/"
	username := ""
	password := ""
	tenantId := ""

	token, err := os.Authenticate(username, password, tenantId)
	if err != nil {
		fmt.Println(err)
		sys.Exit(-1)
	}

	vols, _ := os.ListVolumes(tenantId, token.Id)
	for _, vol := range vols {
		fmt.Printf("%s %s\n", vol.Id, vol.Name)
	}

	//instanceId, _ := os.GetInstanceId()
	instanceId := "e8bbb11f-fb9b-4edb-a718-9baf495af825"
	fmt.Printf("Host instanceId: %s\n", instanceId)

	//volumeId, _ := os.CreateVolume(token, tenantId, "nds-test-vol", 10)

	attachments, _ := os.getVolumeAttachments(token.Id, tenantId, instanceId)
	for _, attachment := range attachments {
		fmt.Printf("%s %s\n", attachment.id, attachment.device)
	}

	//volumeId := "7935509a-9393-495e-b10b-35ba363c3809"
	//os.GetVolume(token.Id, tenantId, volumeId)
	// /etc/machine-id
	//mountPoint := "/dev/vdf"
	//os.AttachVolume(token, tenantId, instanceId, volumeId, mountPoint)
	//time.Sleep(time.Second*10)
	//os.GetVolume(token, tenantId, volumeId)
	//os.Mkfs(mountPoint)
	//os.DetachVolume(token, tenantId, volumeId, instanceId)
	//os.GetVolume(token, tenantId, volumeId)
	//attachmentId := "52ba6092-205a-443b-b36c-904b0e689b33"
	//os.DetachVolume(token, tenantId, instanceId, volumeId)

}
*/

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
	cmd := exec.Command("mkfs", "-t", fstype, mountPoint)
	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()
	if err != nil {
		return err
	}
	return nil
	//fmt.Printf("mkfs response: %s\n", out.String())
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
	url := s.IdentityEndpoint + "/tokens"

	request, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		fmt.Println(httperr)
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
			fmt.Println("Error %s\n", httpresp.Status)
		}
	}
	return nil, nil
}

// DELETE powervc/openstack/compute/v2/{tenant_id}/servers/{server_id}/os-volume_attachments/{attachment_id}
func (s *OpenStack) DetachVolume(token string, tenantId string, instanceId string, attachmentId string) error {

	client := &http.Client{}
	url := s.ComputeEndpoint + tenantId + "/servers/" + instanceId + "/os-volume_attachments/" + attachmentId
	fmt.Println(url)
	request, _ := http.NewRequest("DELETE", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Auth-Token", token)
	httpresp, httperr := client.Do(request)
	if httperr != nil {
		return httperr
	} else {
		if httpresp.StatusCode == http.StatusOK {
			fmt.Printf("Deleted %s\n", httpresp.Status)
		} else {
			fmt.Printf("Error %s\n", httpresp.Status)
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
func (s *OpenStack) AttachVolume(token string, tenantId string, instanceId string, volumeId string, mountPoint string) error {
	attachMap := map[string]interface{}{
		"serverId": instanceId,
		"volumeId": volumeId,
		"device":   mountPoint,
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
