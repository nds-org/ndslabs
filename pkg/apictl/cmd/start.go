// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"os"
)

// startCmd represents the start command
var startCmd = &cobra.Command{
	Use:    "start [stackName]",
	Short:  "Start an app",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}

		stackId := args[0]

		stack, err := client.GetStack(stackId)
		if err != nil {
			fmt.Printf("Start failed: %s\n", err.Error())
			return
		}

		if stack.Status == "started" || stack.Status == "starting" {
			fmt.Print("App already started\n")
			return
		}

		stack, err = client.StartStack(stackId)
		if err != nil {
			fmt.Printf("Error starting %s: %s\n", stackId, err)
		} else {
			fmt.Printf("Started %s\n", stackId)
		}
	},
}

func init() {
	RootCmd.AddCommand(startCmd)
}
