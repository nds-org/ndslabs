// Copyright © 2016 NAME HERE <EMAIL ADDRESS>
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	api "github.com/nds-labs/apiserver/types"
	"github.com/spf13/cobra"
	"io/ioutil"
	"log"
	"net/http"
)

var apiServer = "http://localhost:8083/"

func GetService(serviceName string) *api.Service {
	url := apiServer + "services/" + serviceName

	client := &http.Client{}
	request, err := http.NewRequest("GET", url, nil)

	//fmt.Println(apiUser)
	request.SetBasicAuth(apiUser.username, apiUser.password)
	resp, err := client.Do(request)
	if err != nil {
		log.Fatal(err)
	}

	if resp.StatusCode == http.StatusOK {

		defer resp.Body.Close()
		body, err := ioutil.ReadAll(resp.Body)
		//fmt.Printf("%s", string(body))
		if err != nil {
			log.Fatal(err)
		}

		service := api.Service{}
		json.Unmarshal([]byte(body), &service)
		return &service
	} else {
		return nil
	}
}

func AddConfig(project string, serviceKey string) {
	url := apiServer + "projects/" + project + "/config/" + serviceKey

	config := api.Config{}
	config.Key = serviceKey

	client := &http.Client{}
	data, err := json.Marshal(config)
	request, err := http.NewRequest("PUT",
		url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.SetBasicAuth(apiUser.username, apiUser.password)
	resp, err := client.Do(request)
	if err != nil {
		log.Fatal(err)
	} else {
		if resp.StatusCode == http.StatusOK {
			fmt.Println("Added " + serviceKey)
		} else {
			fmt.Print("Error adding " + serviceKey)
		}

	}
}

// addCmd represents the add command
var addCmd = &cobra.Command{
	Use:   "add",
	Short: "Add the specified service to the current config",
	Run: func(cmd *cobra.Command, args []string) {
		serviceName := args[0]

		//fmt.Printf("Adding service %s\n", serviceName)
		service := GetService(serviceName)
		AddConfig(apiUser.username, service.Key)

		// Add this service to the current config  (how, TBD)

		// Now call add config in the API

		/*
			if service.RequiresVolume {
				fmt.Printf("\tThis service requires a volume\n")
			}
			if len(service.Dependencies) > 0 {
				for _, dependency := range service.Dependencies {
					fmt.Printf("\tRequires %s\n", dependency.DependencyKey)
					dep := GetService(dependency.DependencyKey)
					if dep.RequiresVolume {
						fmt.Printf("\tThis service requires a volume\n")
					}
				}
			}
		*/
	},
}

func init() {
	RootCmd.AddCommand(addCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// addCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// addCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")

}
