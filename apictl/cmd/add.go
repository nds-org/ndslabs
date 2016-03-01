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
	Use:   "add",
	Short: "Add the specified resource",
}

var addStackCmd = &cobra.Command{
	Use:   "stack [stackName]",
	Short: "Add the specified stack to your project",
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}

		addStack(apiUser.username, args[0], opts)
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

func addRequiredDependencies(stackKey string, stack *api.Stack) {

	service := getService(stackKey)

	for _, depends := range service.Dependencies {
		if depends.Required {
			stackService := api.StackService{}
			stackService.Service = depends.DependencyKey
			stack.Services = append(stack.Services, stackService)
			//fmt.Printf("Adding required dependency %s\n", depends.DependencyKey)
			addRequiredDependencies(depends.DependencyKey, stack)
		}
	}
}

func addStack(project string, serviceKey string, opt string) {

	service := getService(serviceKey)
	optional := strings.Split(opt, ",")

	// Add this service
	stack := api.Stack{}
	stack.Key = serviceKey

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
			fmt.Fprintln(w, "SERVICE\tUID")
			for _, stackService := range stack.Services {
				fmt.Fprintf(w, "%s\t%s\n", stackService.Service, stackService.Id)
			}
			w.Flush()

		} else {
			fmt.Printf("Unable to add stack %s: %s \n", serviceKey, resp.Status)
		}

	}
}
