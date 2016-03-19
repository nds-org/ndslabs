// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"
	api "github.com/nds-labs/apiserver/types"
	"github.com/spf13/cobra"
	"os"
	"strconv"
)

var createCmd = &cobra.Command{
	Use:    "create [name] [size] [serviceId]",
	Short:  "Create a volume",
	PreRun: Connect,
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
