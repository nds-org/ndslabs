// Copyright © 2016 National Data Service

package cmd

import (
	"encoding/json"
	"fmt"
	"github.com/spf13/cobra"
)

var (
	user string
	all  bool
)

// stopCmd represents the stop command
var stopCmd = &cobra.Command{
	Use:    "stop",
	Short:  "Stop an app",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		if all {
			client.StopAll()
		} else {
			stackId := args[0]
			stack, err := client.StopStack(stackId, user)

			if err != nil {
				fmt.Printf("Error stopping %s: %s\n", stackId, err)
			} else {
				data, _ := json.MarshalIndent(&stack, "", "    ")

				fmt.Println(string(data))
				fmt.Printf("Stopped %s\n", stackId)
			}
		}
	},
}

func init() {
	RootCmd.AddCommand(stopCmd)
	stopCmd.Flags().StringVar(&opts, "user", "", "User ID (admin only)")
	stopCmd.Flags().BoolVarP(&all, "all", "", false, "Stop all stacks for all users (admin only) ")
}
