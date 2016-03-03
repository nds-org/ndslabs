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
	"encoding/json"
	"fmt"
	api "github.com/nds-labs/apiserver/types"
	"github.com/spf13/cobra"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"text/tabwriter"
)

// listCmd represents the list command
var listCmd = &cobra.Command{
	Use:   "list",
	Short: "List available services or resources",
}

var listServicesCmd = &cobra.Command{
	Use:   "services",
	Short: "List available services",
	Run: func(cmd *cobra.Command, args []string) {

		url := apiServer + "services"

		client := &http.Client{}
		request, err := http.NewRequest("GET", url, nil)

		request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiUser.token))
		resp, err := client.Do(request)
		if err != nil {
			log.Fatal(err)
		}

		if resp.StatusCode == http.StatusOK {

			defer resp.Body.Close()
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				log.Fatal(err)
			}

			services := make([]api.Service, 0)
			json.Unmarshal([]byte(body), &services)
			for _, service := range services {
				if service.IsStack {
					fmt.Printf("%s\n", service.Key)
					for _, dependency := range service.Dependencies {
						if dependency.Required {
							fmt.Printf("\t %s (required)\n", dependency.DependencyKey)
						} else {
							fmt.Printf("\t %s (optional)\n", dependency.DependencyKey)
						}
					}
				}
			}
		} else {
			fmt.Printf("List failed: %s\n", resp.Status)
		}
	},
	PostRun: RefreshToken,
}

var listStacksCmd = &cobra.Command{
	Use:   "stacks",
	Short: "List existing stacks",
	Run: func(cmd *cobra.Command, args []string) {

		url := apiServer + "projects/" + apiUser.username + "/stacks"

		client := &http.Client{}
		request, err := http.NewRequest("GET", url, nil)
		request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiUser.token))
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

			stacks := make([]api.Stack, 0)
			json.Unmarshal([]byte(body), &stacks)
			w := new(tabwriter.Writer)
			w.Init(os.Stdout, 10, 4, 3, ' ', 0)
			fmt.Fprintln(w, "STACK\tSERVICE\tSTATUS\tENDPOINT\tUID")
			for _, stack := range stacks {
				fmt.Fprintf(w, "%s\t\t%s\n", stack.Key, stack.Status)
				for _, service := range stack.Services {
					endpoint := ""
					if (len(service.Endpoints) > 0) {
						endpoint = service.Endpoints[0]
					}
					fmt.Fprintf(w, "\t%s\t%s\t%s\t%s\n", service.Service, service.Status, endpoint, service.Id)
				}
			}
			w.Flush()
		} else {
			fmt.Printf("List failed: %s\n", resp.Status)
		}
	},
	PostRun: RefreshToken,
}

var listVolumesCmd = &cobra.Command{
	Use:   "volumes",
	Short: "List existing volumes",
	Run: func(cmd *cobra.Command, args []string) {

		url := apiServer + "projects/" + apiUser.username + "/volumes"

		client := &http.Client{}
		request, err := http.NewRequest("GET", url, nil)
		request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiUser.token))
		resp, err := client.Do(request)
		if err != nil {
			log.Fatal(err)
		}

		if resp.StatusCode == http.StatusOK {

			defer resp.Body.Close()
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				log.Fatal(err)
			}

			volumes := make([]api.Volume, 0)
			json.Unmarshal([]byte(body), &volumes)

			w := new(tabwriter.Writer)
			w.Init(os.Stdout, 10, 4, 3, ' ', 0)
			fmt.Fprintln(w, "NAME\tATTACHED TO\tSIZE\tSTATUS")
			for _, volume := range volumes {
				fmt.Fprintf(w, "%s\t%s\t%d\t%s\n", volume.Name, volume.Attached, volume.Size, volume.Status)
			}
			w.Flush()

		} else {
			fmt.Printf("List failed: %s\n", resp.Status)
		}
	},
	PostRun: RefreshToken,
}

func init() {
	RootCmd.AddCommand(listCmd)
	listCmd.AddCommand(listServicesCmd)
	listCmd.AddCommand(listStacksCmd)
	listCmd.AddCommand(listVolumesCmd)
}
