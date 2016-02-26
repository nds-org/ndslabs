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
	"strings"
)

var apiServer = "http://localhost:8083/"

func GetService(serviceName string) *api.Service {
	url := apiServer + "services/" + serviceName

	client := &http.Client{}
	request, err := http.NewRequest("GET", url, nil)
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiUser.token))

	//fmt.Println(apiUser)
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

func contains(s []string, e string) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}

func AddRequiredDependencies(stackKey string, stack *api.Stack) {

	service := GetService(stackKey)

	for _, depends := range service.Dependencies {
		if depends.Required {
			stackService := api.StackService{}
			stackService.Service = depends.DependencyKey
			stack.Services = append(stack.Services, stackService)
			fmt.Printf("Adding required dependency %s\n", depends.DependencyKey)
			AddRequiredDependencies(depends.DependencyKey, stack)
		}
	}
}

func AddStack(project string, serviceKey string, opt string) {

	service := GetService(serviceKey)
	optional := strings.Split(opt, ",")

	// Add this service
	stack := api.Stack{}
	stack.Key = serviceKey

	stackService := api.StackService{}
	stackService.Service = serviceKey
	stack.Services = append(stack.Services, stackService)

	AddRequiredDependencies(serviceKey, &stack)

	for _, depends := range service.Dependencies {
		if contains(optional, depends.DependencyKey) {
			stackService = api.StackService{}
			stackService.Service = depends.DependencyKey
			stack.Services = append(stack.Services, stackService)
			AddRequiredDependencies(depends.DependencyKey, &stack)
		}
		/*
			stackService = api.StackService{}
			stackService.Service = depends.DependencyKey
			if depends.Required {
				stack.Services = append(stack.Services, stackService)
				//fmt.Printf("Adding dependency %s\n", depends.DependencyKey)
			} else if contains(optional, depends.DependencyKey) {
				stack.Services = append(stack.Services, stackService)
			}
		*/
	}
	// Does the stack exist?

	url := apiServer + "projects/" + project + "/stacks"

	client := &http.Client{}
	data, err := json.Marshal(stack)
	request, err := http.NewRequest("POST",
		url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiUser.token))
	resp, err := client.Do(request)
	if err != nil {
		log.Fatal(err)
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				log.Fatal(err)
			}

			fmt.Println("Added stack " + serviceKey)

			stack := api.Stack{}
			json.Unmarshal([]byte(body), &stack)
			//fmt.Printf(string(body))

			for _, stackService := range stack.Services {
				fmt.Printf("%s %s\n", stackService.Service, stackService.Id)
			}
		} else {
			fmt.Println("Error adding " + serviceKey)
		}

	}
}

// addCmd represents the add command
var addCmd = &cobra.Command{
	Use:   "add",
	Short: "Add the specified service stack",
	Run: func(cmd *cobra.Command, args []string) {
		key := args[0]
		optional := ""
		if len(args) > 1 {
			optional = args[1]
		}

		//fmt.Printf("Adding service %s\n", serviceName)
		AddStack(apiUser.username, key, optional)

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
