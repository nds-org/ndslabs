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
)

var attachCmd = &cobra.Command{
	Use:   "attach [volumeName] [serviceId]",
	Short: "Attach a volume to a stack service",
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) < 2 {
			cmd.Usage()
			os.Exit(-1)
		}

		name := args[0]
		ssid := args[1]

		volume := getVolume(name)
		if volume == nil {
			return
		}

		volume.Attached = ssid

		data, err := json.Marshal(&volume)
		if err != nil {
			fmt.Printf("Error creating volume: %s\n", err.Error())
			return
		}

		url := apiServer + "projects/" + apiUser.username + "/volumes/" + name

		client := &http.Client{}
		request, err := http.NewRequest("PUT", url, bytes.NewBuffer(data))
		if err != nil {
			fmt.Printf("Attach failed: %s\n", err.Error())
			return
		}

		request.Header.Set("Content-Type", "application/json")
		request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiUser.token))
		resp, err := client.Do(request)
		if err != nil {
			fmt.Printf("Attach failed: %s\n", err.Error())
			return
		}

		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				log.Fatal(err)
			}

			fmt.Print(string(body))
			volume := api.Volume{}
			json.Unmarshal([]byte(body), &volume)
			fmt.Printf("Attached volume %s\n", volume.Name)
		} else {
			fmt.Printf("Attach failed: %s\n", resp.Status)
		}
	},
}

func getVolume(name string) *api.Volume {

	url := apiServer + "projects/" + apiUser.username + "/volumes/" + name

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
		if err != nil {
			log.Fatal(err)
		}

		volume := api.Volume{}
		json.Unmarshal([]byte(body), &volume)
		return &volume
	} else {
		fmt.Printf("Get volume failed: %s\n", resp.Status)
		return nil
	}
}

func init() {
	RootCmd.AddCommand(attachCmd)
}
