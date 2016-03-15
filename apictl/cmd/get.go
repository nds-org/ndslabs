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
	"os"
)

var getCmd = &cobra.Command{
	Use:   "get",
	Short: "Get service or resource details",
}

var getServiceCmd = &cobra.Command{
	Use:    "service",
	Short:  "Get service details",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}
		sid := args[0]

		service, err := client.GetService(sid)
		if err != nil {
			fmt.Printf("Get service failed: %s\n", err)
			return
		}

		data, err := json.MarshalIndent(service, "", "   ")
		if err != nil {
			fmt.Printf("Error marshalling service spec %s\n", err.Error)
			return
		}
		fmt.Println(string(data))
	},
	PostRun: RefreshToken,
}

var getStackCmd = &cobra.Command{
	Use:    "stack",
	Short:  "Get stack details",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}
		sid := args[0]

		stack, err := client.GetStack(apiUser.username, sid)
		if err != nil {
			fmt.Printf("Get stack failed: %s\n", err)
			return
		}

		data, err := json.MarshalIndent(stack, "", "   ")
		if err != nil {
			fmt.Printf("Error marshalling stack %s\n", err.Error)
			return
		}
		fmt.Println(string(data))
	},
	PostRun: RefreshToken,
}

var getProjectCmd = &cobra.Command{
	Use:    "project",
	Short:  "Get project details",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		pid := apiUser.username
		if len(args) == 1 {
			pid = args[0]
		}
		project, err := client.GetProject(pid)
		if err != nil {
			fmt.Printf("Get project failed: %s\n", err)
			return
		}

		data, err := json.MarshalIndent(project, "", "   ")
		if err != nil {
			fmt.Printf("Error marshalling project %s\n", err.Error)
			return
		}
		fmt.Println(string(data))
	},
	PostRun: RefreshToken,
}

func init() {
	RootCmd.AddCommand(getCmd)
	getCmd.AddCommand(getServiceCmd)
	getCmd.AddCommand(getStackCmd)
	getCmd.AddCommand(getProjectCmd)
}
