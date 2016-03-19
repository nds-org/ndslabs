// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"os"
)

var (
	lines int
)

// logsCmd represents the log command
var logsCmd = &cobra.Command{
	Use:    "logs [serviceId]",
	Short:  "Print logs for the stack",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		if len(args) < 1 {
			cmd.Usage()
			os.Exit(-1)
		}

		serviceId := args[0]

		logs, err := client.GetLogs(apiUser.username, serviceId, lines)
		if err != nil {
			fmt.Printf("Error getting logs %s: %s\n", serviceId, err)
		} else {
			fmt.Println(logs)
		}
	},
	PostRun: RefreshToken,
}

func init() {
	logsCmd.Flags().IntVar(&lines, "lines", -1, "Number of lines of the tail of the log to output")
	RootCmd.AddCommand(logsCmd)
}
