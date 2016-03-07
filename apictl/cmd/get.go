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
)

var getCmd = &cobra.Command{
	Use:   "get",
	Short: "Get service or resource details",
}

var getServiceCmd = &cobra.Command{
	Use:   "service",
	Short: "Get service details",
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}
		sid := args[0]

		url := fmt.Sprintf("%sservices/%s", apiServer, sid)

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
				fmt.Printf("Error reading service spec %s\n", err.Error)
				return
			}

			service := api.ServiceSpec{}
			err = json.Unmarshal([]byte(body), &service)
			if err != nil {
				fmt.Printf("Error unmarshalling service spec %s\n", err.Error)
				return
			}

			data, err := json.MarshalIndent(service, "", "   ")
			if err != nil {
				fmt.Printf("Error marshalling service spec %s\n", err.Error)
				return
			}
			fmt.Println(string(data))
		} else {
			fmt.Printf("Get service failed: %s\n", resp.Status)
		}
	},
	PostRun: RefreshToken,
}

var getStackCmd = &cobra.Command{
	Use:   "stack",
	Short: "Get stack details",
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}
		sid := args[0]

		url := fmt.Sprintf("%sprojects/%s/stacks/%s", apiServer, apiUser.username, sid)

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
				fmt.Printf("Error reading stack %s\n", err.Error)
				return
			}

			stack := api.Stack{}
			err = json.Unmarshal([]byte(body), &stack)
			if err != nil {
				fmt.Printf("Error unmarshalling stack %s\n", err.Error)
				return
			}

			data, err := json.MarshalIndent(stack, "", "   ")
			if err != nil {
				fmt.Printf("Error marshalling stack %s\n", err.Error)
				return
			}
			fmt.Println(string(data))
		} else {
			fmt.Printf("Get stack failed: %s\n", resp.Status)
		}
	},
	PostRun: RefreshToken,
}

func init() {
	RootCmd.AddCommand(getCmd)
	getCmd.AddCommand(getServiceCmd)
	getCmd.AddCommand(getStackCmd)
}
