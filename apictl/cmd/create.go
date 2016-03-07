// Copyright © 2016 NAME HERE <EMAIL ADDRESS> //
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
	"net/http"
	"os"
	"strconv"
)

var createCmd = &cobra.Command{
	Use:   "create [name] [size] [serviceId]",
	Short: "Create a volume",
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) < 2 {
			cmd.Usage()
			os.Exit(-1)
		}

		name := args[0]
		size, err := strconv.Atoi(args[1])
		if err != nil {
			fmt.Printf("Error creating volume: %s\n", err.Error())
			return
		}

		volume := api.Volume{}
		volume.Name = name
		volume.Size = size
		volume.SizeUnit = "GB"
		if len(args) == 3 {
			volume.Attached = args[2]
		}

		data, err := json.Marshal(&volume)
		if err != nil {
			fmt.Printf("Error creating volume: %s\n", err.Error())
			return
		}

		url := apiServer + "projects/" + apiUser.username + "/volumes"

		client := &http.Client{}
		request, err := http.NewRequest("POST", url, bytes.NewBuffer(data))
		request.Header.Set("Content-Type", "application/json")
		request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiUser.token))
		resp, err := client.Do(request)
		if err != nil {
			fmt.Printf("Error creating volume: %s\n", err.Error())
			return

		} else {
			if resp.StatusCode == http.StatusOK {
				defer resp.Body.Close()
				body, err := ioutil.ReadAll(resp.Body)
				if err != nil {
					fmt.Printf("Error creating volume: %s\n", err.Error())
					return
				}

				fmt.Print(string(body))
				volume := api.Volume{}
				json.Unmarshal([]byte(body), &volume)
				fmt.Printf("Created volume %s", volume.Name)
			} else {
				fmt.Printf("Error creating volume: %s\n", resp.Status)
				return
			}
		}
	},
}

func init() {
	RootCmd.AddCommand(createCmd)
}
