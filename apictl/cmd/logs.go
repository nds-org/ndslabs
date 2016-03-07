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
	"io/ioutil"
	"log"
	"net/http"
	"os"
)

var (
	lines int
)

// logsCmd represents the log command
var logsCmd = &cobra.Command{
	Use:   "logs [serviceId]",
	Short: "Print logs for the stack",
	Run: func(cmd *cobra.Command, args []string) {

		if len(args) < 1 {
			cmd.Usage()
			os.Exit(-1)
		}

		serviceId := args[0]

		url := apiServer + "projects/" + apiUser.username + "/logs/" + serviceId
		if lines > 0 {
			url += fmt.Sprintf("?lines=%d", lines)
		}

		client := &http.Client{}
		request, err := http.NewRequest("GET", url, nil)
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
				var log string
				json.Unmarshal(body, &log)
				fmt.Printf("%s\n", log)

			} else {
				fmt.Printf("Error getting logs %s: %s\n", serviceId, resp.Status)
			}
		}
	},
}

func init() {
	logsCmd.Flags().IntVar(&lines, "lines", -1, "Number of lines of the tail of the log to output")
	RootCmd.AddCommand(logsCmd)
}
