package main

import (
	openstack "github.com/nds-labs/apiserver/openstack"
	"github.com/golang/glog"
	"flag"
	"fmt"
	sys "os"
)

func main() {
	var command, volumeId string
	flag.StringVar(&command, "c", "", "")
	flag.StringVar(&volumeId, "vol", "", "")
	flag.Parse()
	os := openstack.OpenStack{}
	os.IdentityEndpoint = "http://nebula.ncsa.illinois.edu:5000/v2.0/"
	os.VolumesEndpoint = "http://nebula.ncsa.illinois.edu:8776/v2/"
	os.ComputeEndpoint = "http://nebula.ncsa.illinois.edu:8774/v2/"
	username := ""
	password := ""
	tenantId := ""

	token, err := os.Authenticate(username, password, tenantId)
	if err != nil {
		glog.Error(err)
		sys.Exit(-1)
	}

	instanceId, _ := os.GetInstanceId()
	glog.Infof("Host instanceId: %s\n", instanceId)

	if (command ==  "list") {
		vols, _ := os.ListVolumes(tenantId, token.Id)
		for _, vol := range vols {
			fmt.Printf("%s %s\n", vol.Id, vol.Name)
		}
	}

	if (command == "create") {
		vid, _ := os.CreateVolume(token.Id, tenantId, "nds-test-vol-2", 10)
		fmt.Printf("volumeId = %s\n", vid)	
	}

	if (command == "attachments") {
		attachments, _ := os.GetVolumeAttachments(token.Id, tenantId, instanceId)
		for _, attachment := range attachments {
			fmt.Printf("%s %s\n", attachment.Id, attachment.Device)
		}
	}	

	if (volumeId != "") {
		vol, err := os.GetVolume(token.Id, tenantId, volumeId)
		if (err != nil) {
			glog.Error(err)
			sys.Exit(-1)
		}
	
		if (command == "volume") {
			fmt.Printf("%s %s %s %s %d", vol.Id, vol.Name, vol.ServerId, vol.Device, vol.Size)
		}
	
		// /etc/machine-id
		if (command == "attach") {
			os.AttachVolume(token.Id, tenantId, instanceId, volumeId)
		}

		if (command == "mkfs") { 
			os.Mkfs(vol.Device, "xfs")
		}

		if (command == "detach") {
			os.DetachVolume(token.Id, tenantId, instanceId, volumeId)
		}

		if (command == "delete") {
			os.DeleteVolume(token.Id, tenantId, volumeId)
		}
	}	

}

