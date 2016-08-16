// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"os"
)

func init() {
	RootCmd.AddCommand(verifyCmd)
	RootCmd.AddCommand(approveCmd)
}

var verifyCmd = &cobra.Command{
	Use:    "verify [username] [token]",
	Short:  "Verify a registered account ",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		if len(args) == 2 {
			username := args[0]
			token := args[1]
			err := client.Verify(username, token)
			if err != nil {
				fmt.Printf("Unable to verify token: %s \n", err)
			} else {
				fmt.Println("Account verified")
			}
		} else {
			cmd.Usage()
			os.Exit(-1)
		}
	},
}

var approveCmd = &cobra.Command{
	Use:    "approve [username] [token]",
	Short:  "Approve a registered account ",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		if len(args) == 2 {
			username := args[0]
			token := args[1]
			err := client.Approve(username, token)
			if err != nil {
				fmt.Printf("Unable to approve user: %s \n", err)
			} else {
				fmt.Println("Account approved")
			}
		} else {
			cmd.Usage()
			os.Exit(-1)
		}
	},
}
