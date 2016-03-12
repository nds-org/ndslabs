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
	"os"
)

var detachCmd = &cobra.Command{
	Use:   "detach [volumeName]",
	Short: "Detach a volume from a stack service",
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) < 1 {
			cmd.Usage()
			os.Exit(-1)
		}

		name := args[0]

		volume, err := client.GetVolume(apiUser.username, name)
		if err != nil {
			fmt.Printf("Detach failed: %s\n", err.Error())
			return
		}

		volume.Attached = ""

		vol, err := client.UpdateVolume(apiUser.username, volume)
		if err != nil {
			fmt.Printf("Detach failed: %s\n", err.Error())
		} else {
			fmt.Printf("Detached volume %s\n", vol.Name)
		}
	},
	PostRun: RefreshToken,
}

func init() {
	RootCmd.AddCommand(detachCmd)
}
