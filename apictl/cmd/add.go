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
	"os"
	"strings"
	"text/tabwriter"
)

var (
	opts string
)

func init() {
	RootCmd.AddCommand(addCmd)
	addCmd.AddCommand(addStackCmd)

	// add stack flags
	addStackCmd.Flags().StringVar(&opts, "opt", "", "Comma-delimited list of optional services")
}

var addCmd = &cobra.Command{
	Use:   "add [stack] [name]",
	Short: "Add the specified resource",
}

var addStackCmd = &cobra.Command{
	Use:   "stack [serviceKey] [name]",
	Short: "Add the specified stack to your project",
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) < 2 {
			cmd.Usage()
			os.Exit(-1)
		}

		addStack(apiUser.username, args[0], args[1], opts)
	},
}

func getService(serviceName string) *api.Service {
	url := apiServer + "services/" + serviceName

	client := &http.Client{}
	request, err := http.NewRequest("GET", url, nil)
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiUser.token))

	//fmt.Println(apiUser)
	resp, err := client.Do(request)
	if err != nil {
		fmt.Printf("Error getting service: %s\n", err.Error())
		os.Exit(-1)
	}

	if resp.StatusCode == http.StatusOK {

		defer resp.Body.Close()
		body, err := ioutil.ReadAll(resp.Body)
		//fmt.Printf("%s", string(body))
		if err != nil {
			fmt.Printf("Error getting service: %s\n", err.Error())
			os.Exit(-1)
		}

		service := api.Service{}
		json.Unmarshal([]byte(body), &service)
		return &service
	} else {
		fmt.Printf("Error getting service: %s\n", resp.Status)
		os.Exit(-1)
	}
	return nil
}

func contains(s []string, e string) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}

func addRequiredDependencies(stackKey string, stack *api.Stack) {

	service := getService(stackKey)

	for _, depends := range service.Dependencies {
		if depends.Required {
			stackService := api.StackService{}
			stackService.Service = depends.DependencyKey
			if !containsService(stack.Services, stackService) {
				stack.Services = append(stack.Services, stackService)
				//fmt.Printf("Adding required dependency %s\n", depends.DependencyKey)
				addRequiredDependencies(depends.DependencyKey, stack)
			}
		}
	}
}

func containsService(list []api.StackService, service api.StackService) bool {
	exists := false
	for _, item := range list {
		if item.Service == service.Service {
			exists = true
			break
		}
	}
	return exists
}

func addStack(project string, serviceKey string, name string, opt string) {

	service := getService(serviceKey)
	optional := strings.Split(opt, ",")

	// Add this service
	stack := api.Stack{}
	stack.Key = serviceKey
	stack.Name = name

	stackService := api.StackService{}
	stackService.Service = serviceKey
	stack.Services = append(stack.Services, stackService)

	addRequiredDependencies(serviceKey, &stack)

	for _, depends := range service.Dependencies {
		if contains(optional, depends.DependencyKey) {
			stackService = api.StackService{}
			stackService.Service = depends.DependencyKey
			stack.Services = append(stack.Services, stackService)
			addRequiredDependencies(depends.DependencyKey, &stack)
		}
	}

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

			w := new(tabwriter.Writer)
			w.Init(os.Stdout, 20, 30, 0, '\t', 0)
			fmt.Fprintln(w, "SERVICE\tSID")
			for _, stackService := range stack.Services {
				fmt.Fprintf(w, "%s\t%s\n", stackService.Service, stackService.Id)
			}
			w.Flush()

		} else {
			fmt.Printf("Unable to add stack %s %s: %s \n", name, serviceKey, resp.Status)
		}

	}
}
