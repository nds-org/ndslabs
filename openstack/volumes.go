package main

import (
	"fmt"
	"github.com/rackspace/gophercloud"
	"github.com/rackspace/gophercloud/openstack"
	"io/ioutil"
	"strings"
	//	"github.com/rackspace/gophercloud/openstack/blockstorage/v1/volumes"
	//	"github.com/rackspace/gophercloud/pagination"
	"log"
)

func main() {
	opts := gophercloud.AuthOptions{
		IdentityEndpoint: "http://nebula.ncsa.illinois.edu:5000/v2.0",
		Username:         "willis8",
		Password:         "zes3Drux",
		TenantID:         "3836c0d58e3349b28fc740e33a58a7e3",
	}

	provider, err := openstack.AuthenticatedClient(opts)
	client, err := openstack.NewBlockStorageV1(provider,
		gophercloud.EndpointOpts{
			Region: "RegionOne",
		})

	if err != nil {
		log.Fatal(err)
	}

	url := client.ServiceURL("volumes")
	url = strings.Replace(url, "/v2/", "/v1/", -1)
	//	fmt.Printf("%s\n", url)

	resp, err := client.Request("GET", url, gophercloud.RequestOpts{})
	if err != nil {
		log.Fatal(err)
	}

	defer resp.Body.Close()
	rawBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("%s", string(rawBody))
}
