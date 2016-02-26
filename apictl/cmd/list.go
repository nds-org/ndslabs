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

//var apiServer = "http://localhost:8083/"

// listCmd represents the list command
var listCmd = &cobra.Command{
	Use:   "list",
	Short: "List available services or resources",
	Long: `List available services or resources. For example: 

$ apictl list services
$ apictl list resources`,
	Run: func(cmd *cobra.Command, args []string) {

		resource := args[0]

		url := apiServer + resource

		if resource == "stacks" {
			url = apiServer + "projects/" + apiUser.username + "/stacks"
		} else if resource == "volumes" {
			url = apiServer + "projects/" + apiUser.username + "/volumes"
		}

		client := &http.Client{}
		request, err := http.NewRequest("GET", url, nil)
		//fmt.Print(apiUser)

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

			if resource == "services" {
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
			} else if resource == "projects" {
				projects := make([]api.Project, 0)
				json.Unmarshal([]byte(body), &projects)
				for _, project := range projects {
					fmt.Printf("%s %s\n", project.Id, project.Name)
				}
			} else if resource == "stacks" {
				stacks := make([]api.Stack, 0)
				json.Unmarshal([]byte(body), &stacks)
				w := new(tabwriter.Writer)
				w.Init(os.Stdout, 0, 20, 0, '\t', 0)
				fmt.Fprintln(w, "STACK\tSERVICE\tSTATUS\tENDPOINT\tUID")
				for _, stack := range stacks {
					fmt.Fprintf(w, "%s\t\t\n", stack.Key)
					for _, service := range stack.Services {
						fmt.Fprintf(w, "\t%s\t%s\t%s\t%s\n", service.Service, service.Status, service.Endpoints[0], service.Id)
					}
				}
				w.Flush()
			} else if resource == "volumes" {
				volumes := make([]api.Volume, 0)
				json.Unmarshal([]byte(body), &volumes)
				for _, volume := range volumes {
					fmt.Printf("%s\n", volume.Id)
				}
			}
		} else {
			fmt.Printf("%s\n", resp.Status)
		}
	},
	PostRun: RefreshToken,
}

func init() {
	RootCmd.AddCommand(listCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// listCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// listCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")

}
