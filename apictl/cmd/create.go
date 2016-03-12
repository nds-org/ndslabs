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
	"fmt"
	api "github.com/nds-labs/apiserver/types"
	"github.com/spf13/cobra"
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

		vol, err := client.AddVolume(apiUser.username, &volume)
		if err != nil {
			fmt.Printf("Error creating volume: %s\n", err.Error())
			return
		} else {
			fmt.Printf("Created volume %s\n", vol.Name)
		}
	},
}

func init() {
	RootCmd.AddCommand(createCmd)
}
