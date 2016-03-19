// Copyright © 2016 National Data Service

package cmd

import (
	"encoding/json"
	"fmt"
	"github.com/spf13/cobra"
)

// stopCmd represents the stop command
var stopCmd = &cobra.Command{
	Use:    "stop",
	Short:  "Stop a stack",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		stackId := args[0]

		stack, err := client.StopStack(apiUser.username, stackId)

		if err != nil {
			fmt.Printf("Error stopping %s: %s\n", stackId, err)
		} else {
			data, _ := json.MarshalIndent(&stack, "", "    ")

			fmt.Println(string(data))
			fmt.Printf("Stopped %s\n", stackId)
		}
	},
}

func init() {
	RootCmd.AddCommand(stopCmd)
}
