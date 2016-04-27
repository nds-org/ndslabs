// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"os"
)

// consoleCmd represents the console command
var consoleCmd = &cobra.Command{
	Use:    "console [stack service]",
	Short:  "Access console of stack service container",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		if len(args) < 1 {
			cmd.Usage()
			os.Exit(-1)
		}

		ssid := args[0]

		err := client.CheckConsole(apiUser.username, ssid)
		if err != nil {
			fmt.Printf("Error getting console: %s\n", err)
			return
		}

		client.Console(apiUser.username, ssid)
	},
	PostRun: RefreshToken,
}

func init() {
	RootCmd.AddCommand(consoleCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// consoleCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// consoleCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")

}
