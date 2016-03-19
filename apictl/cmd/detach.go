// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"os"
)

var detachCmd = &cobra.Command{
	Use:    "detach [volumeName]",
	Short:  "Detach a volume from a stack service",
	PreRun: Connect,
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
