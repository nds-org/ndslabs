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
	"strings"
)

var setCmd = &cobra.Command{
	Use:    "set [stack service id] [var name] [var value]",
	Short:  "Set stack service environment values",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) < 3 {
			cmd.Usage()
			os.Exit(-1)
		}
		ssid := args[0]
		varName := args[1]
		varValue := args[2]

		sid := ssid[0:strings.Index(ssid, "-")]
		stack, err := client.GetStack(apiUser.username, sid)
		if err != nil {
			fmt.Printf("Get stack failed: %s\n", err)
			return
		}

		for i, stackService := range stack.Services {
			if stackService.Id == ssid {
				spec, err := client.GetService(stackService.Service)
				if err != nil {
					fmt.Printf("Error getting service spec %s\n", err.Error)
				}
				for _, config := range spec.Config {
					if config.Name == varName {
						if stackService.Config == nil {
							stackService.Config = make(map[string]string)
						}
						if config.CanOverride {
							fmt.Printf("%s %s %t\n", varName, varValue, config.CanOverride)
							stackService.Config[varName] = varValue
							stack.Services[i] = stackService
						} else {
							fmt.Printf("Cannot override variable %s\n", varName)
							return
						}
					}
				}
			}
		}
		err = client.UpdateStack(apiUser.username, stack)
		if err != nil {
			fmt.Printf("Error updating stack: %s\n", err)
			return
		}
		if Verbose {
			data, err := json.MarshalIndent(stack, "", "   ")
			if err != nil {
				fmt.Printf("Error marshalling stack %s\n", err.Error)
				return
			}

			fmt.Println(string(data))
		}

	},
	PostRun: RefreshToken,
}

func init() {
	RootCmd.AddCommand(setCmd)
}
