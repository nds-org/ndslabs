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
	RootCmd.AddCommand(denyCmd)
	RootCmd.AddCommand(resetCmd)
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

var denyCmd = &cobra.Command{
	Use:    "deny [username] [token]",
	Short:  "Approve a registered account ",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		if len(args) == 2 {
			username := args[0]
			token := args[1]
			err := client.Deny(username, token)
			if err != nil {
				fmt.Printf("Unable to deny user: %s \n", err)
			} else {
				fmt.Println("Account denied")
			}
		} else {
			cmd.Usage()
			os.Exit(-1)
		}
	},
}

var resetCmd = &cobra.Command{
	Use:    "reset [username]",
	Short:  "Send password reset email for user",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		if len(args) == 1 {
			username := args[0]
			err := client.Recover(username)
			if err != nil {
				fmt.Printf("Unable to request password reset: %s \n", err)
			} else {
				fmt.Println("Password reset requested ")
			}
		} else {
			cmd.Usage()
			os.Exit(-1)
		}
	},
}
