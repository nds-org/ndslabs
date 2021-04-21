// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
)

// loglevelCmd represents the loglevel command
var loglevelCmd = &cobra.Command{
	Use:    "log_level",
	Short:  "Set the log level (0-4)",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		level := args[0]
		err := client.SetLogLevel(level)
		if err != nil {
			fmt.Printf("Error setting log level: %s\n", err)
		} else {
			fmt.Printf("Set log level to %s\n", level)
		}
	},
}

func init() {
	RootCmd.AddCommand(loglevelCmd)
}
