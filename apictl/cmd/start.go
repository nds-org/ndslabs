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

// startCmd represents the start command
var startCmd = &cobra.Command{
	Use:   "start [stackName]",
	Short: "Start the specified resource",
	Run: func(cmd *cobra.Command, args []string) {

		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}

		stackId := args[0]

		stack, err := getStack(apiUser.username, stackId)
		if err != nil {
			fmt.Printf("Start failed: %s\n", err.Error())
			return
		}

		if stack.Status == "started" || stack.Status == "starting" {
			fmt.Print("Stack already started\n")
			return
		}

		url := apiServer + "projects/" + apiUser.username + "/start/" + stackId

		client := &http.Client{}
		request, err := http.NewRequest("GET", url, nil)
		request.Header.Set("Content-Type", "application/json")
		request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiUser.token))
		resp, err := client.Do(request)
		if err != nil {
			log.Fatal(err)
		} else {
			if resp.StatusCode == http.StatusOK {
				fmt.Printf("Started %s\n", stackId)
			} else {
				fmt.Printf("Error starting %s: %s\n", stackId, resp.Status)
			}
		}
	},
}

func init() {
	RootCmd.AddCommand(startCmd)
}

func getStack(pid string, stack string) (*api.Stack, error) {
	url := apiServer + "projects/" + apiUser.username + "/stacks/" + stack

	client := &http.Client{}
	request, err := http.NewRequest("GET", url, nil)
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiUser.token))
	resp, err := client.Do(request)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode == http.StatusOK {

		defer resp.Body.Close()
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			log.Fatal(err)
		}

		stack := api.Stack{}
		json.Unmarshal([]byte(body), &stack)
		return &stack, nil
	} else {
		return nil, fmt.Errorf("%s", resp.Status)
	}
}
