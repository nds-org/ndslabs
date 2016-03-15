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
	"github.com/spf13/cobra"
	"log"
	"os"
	"text/tabwriter"
)

// listCmd represents the list command
var listCmd = &cobra.Command{
	Use:   "list",
	Short: "List available services or resources",
}

var listServicesCmd = &cobra.Command{
	Use:    "services",
	Short:  "List available services",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		services, err := client.ListServices()
		if err != nil {
			log.Fatal(err)
		}

		w := new(tabwriter.Writer)
		w.Init(os.Stdout, 10, 4, 3, ' ', 0)
		fmt.Fprintln(w, "SERVICE\tDEPENDENCY\tREQUIRED")
		for _, service := range *services {
			if service.IsStack {
				fmt.Fprintf(w, "%s\n", service.Key)
				for _, dependency := range service.Dependencies {
					if dependency.Required {
						fmt.Fprintf(w, "\t%s\t(required)\n", dependency.DependencyKey)
					} else {
						fmt.Fprintf(w, "\t%s\t(optional)\n", dependency.DependencyKey)
					}
				}
			}
		}
		w.Flush()
	},
	PostRun: RefreshToken,
}

var listStacksCmd = &cobra.Command{
	Use:    "stacks",
	Short:  "List existing stacks",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		stacks, err := client.ListStacks(apiUser.username)
		if err != nil {
			fmt.Printf("List failed: %s\n", err)
			os.Exit(-1)
		}
		w := new(tabwriter.Writer)
		w.Init(os.Stdout, 10, 4, 3, ' ', 0)
		fmt.Fprintln(w, "STACK\tSERVICE\tSTATUS\tENDPOINT\tSID\tCONFIG")
		for _, stack := range *stacks {

			fmt.Fprintf(w, "%s\t\t%s\t\t%s\n", stack.Name, stack.Status, stack.Id)
			for _, service := range stack.Services {
				spec, _ := client.GetService(service.Service)
				endpoints := ""
				if len(service.Endpoints) > 0 {
					for _, ep := range service.Endpoints {
						endpoints = " " + ep
					}
				}
				env := ""
				for _, config := range spec.Config {
					name := config.Name
					value := config.Value
					if config.CanOverride {
						if val, ok := service.Config[name]; ok {
							value = val
						}
						env += fmt.Sprintf("%s=%s ", name, value)
					}
				}
				fmt.Fprintf(w, "\t%s\t%s\t%s\t%s\t%s\n", service.Service, service.Status, endpoints, service.Id, env)
			}
		}
		w.Flush()
		if Verbose {
			data, _ := json.MarshalIndent(stacks, "", "   ")
			fmt.Println(string(data))
		}
	},
	PostRun: RefreshToken,
}

var listVolumesCmd = &cobra.Command{
	Use:    "volumes",
	Short:  "List existing volumes",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		volumes, err := client.ListVolumes(apiUser.username)
		if err != nil {
			fmt.Printf("List failed: %s\n", err)
			os.Exit(-1)
		}

		w := new(tabwriter.Writer)
		w.Init(os.Stdout, 10, 4, 3, ' ', 0)
		fmt.Fprintln(w, "NAME\tATTACHED TO\tSIZE\tSTATUS")
		for _, volume := range *volumes {
			fmt.Fprintf(w, "%s\t%s\t%d\t%s\n", volume.Name, volume.Attached, volume.Size, volume.Status)
		}
		w.Flush()
	},
	PostRun: RefreshToken,
}

var listProjectsCmd = &cobra.Command{
	Use:    "projects",
	Short:  "List existing projects (admin users only)",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		projects, err := client.ListProjects()
		if err != nil {
			fmt.Printf("List failed: %s\n", err)
			os.Exit(-1)
		}

		w := new(tabwriter.Writer)
		w.Init(os.Stdout, 10, 4, 3, ' ', 0)
		fmt.Fprintln(w, "ID\tNAMESPACE")
		for _, project := range *projects {
			fmt.Fprintf(w, "%s\t%s\n", project.Id, project.Namespace)
		}
		w.Flush()

	},
	PostRun: RefreshToken,
}

func init() {
	RootCmd.AddCommand(listCmd)
	listCmd.AddCommand(listServicesCmd)
	listCmd.AddCommand(listStacksCmd)
	listCmd.AddCommand(listVolumesCmd)
	listCmd.AddCommand(listProjectsCmd)
}
