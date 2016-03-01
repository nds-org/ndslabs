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
	"fmt"
	"github.com/spf13/cobra"
	"io/ioutil"
	"log"
	"net/http"
	"os"
)

func init() {
	RootCmd.AddCommand(deleteCmd)
	deleteCmd.AddCommand(deleteStackCmd)
	deleteCmd.AddCommand(deleteVolumeCmd)
}

var deleteCmd = &cobra.Command{
	Use:   "delete",
	Short: "Delete the specified resource",
}

var deleteStackCmd = &cobra.Command{
	Use:   "stack [stackName]",
	Short: "Remove the specified stack",
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}

		deleteStack(apiUser.username, args[0])
	},
}

var deleteVolumeCmd = &cobra.Command{
	Use:   "volume [volumeId]",
	Short: "Remove the specified volume",
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}

		deleteVolume(apiUser.username, args[0])
	},
}

func deleteVolume(project string, volumeId string) {

	url := apiServer + "projects/" + project + "/volumes/" + volumeId

	client := &http.Client{}
	request, err := http.NewRequest("DELETE", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiUser.token))
	resp, err := client.Do(request)
	if err != nil {
		log.Fatal(err)
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			_, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				log.Fatal(err)
			}

			fmt.Println("Deleted volume " + volumeId)

		} else {
			fmt.Printf("Unable to delete volume %s: %s \n", volumeId, resp.Status)
		}
	}
}

func deleteStack(project string, stackKey string) {

	url := apiServer + "projects/" + project + "/stacks/" + stackKey

	client := &http.Client{}
	request, err := http.NewRequest("DELETE", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiUser.token))
	resp, err := client.Do(request)
	if err != nil {
		log.Fatal(err)
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			_, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				log.Fatal(err)
			}

			fmt.Println("Deleted stack " + stackKey)

		} else {
			fmt.Printf("Unable to delete stack %s: %s \n", stackKey, resp.Status)
		}
	}
}
