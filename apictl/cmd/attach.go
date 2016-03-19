// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"os"
)

var attachCmd = &cobra.Command{
	Use:    "attach [volumeName] [serviceId]",
	Short:  "Attach a volume to a stack service",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) < 2 {
			cmd.Usage()
			os.Exit(-1)
		}

		name := args[0]
		ssid := args[1]

		volume, err := client.GetVolume(apiUser.username, name)
		if err != nil {
			fmt.Printf("Attach failed: %s\n", err.Error())
			return
		}

		volume.Attached = ssid

		vol, err := client.UpdateVolume(apiUser.username, volume)
		if err != nil {
			fmt.Printf("Attach failed: %s\n", err.Error())
		} else {
			fmt.Printf("Attached volume %s\n", vol.Name)
		}
	},
	PostRun: RefreshToken,
}

func init() {
	RootCmd.AddCommand(attachCmd)
}
