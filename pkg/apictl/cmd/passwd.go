// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"golang.org/x/crypto/ssh/terminal"
	"strings"
	"syscall"
)

func init() {
	RootCmd.AddCommand(passwdCmd)
}

var passwdCmd = &cobra.Command{
	Use:    "passwd",
	Short:  "Change password for current user",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		account, err := client.GetAccount(apiUser.username)
		if err != nil {
			fmt.Printf("Error changing password: %s\n", err)
			return
		}

		fmt.Print("Current password: ")
		currentPassword := getPassword()
		fmt.Print("\n")
		token, err := client.Login(apiUser.username, currentPassword)
		if token == "" {
			fmt.Println("Password is invalid")
			return
		}

		fmt.Print("New password: ")
		newPassword := getPassword()
		fmt.Print("\n")
		if newPassword == "" {
			fmt.Println("Password cannot be blank")
			return
		}

		fmt.Print("Confirm new password: ")
		confirmPassword := getPassword()
		fmt.Print("\n")
		if newPassword != confirmPassword {
			fmt.Println("Passwords do not match")
			return
		}

		if newPassword == confirmPassword && token != "" {
			account.Password = newPassword
			err := client.UpdateAccount(account)
			if err != nil {
				fmt.Printf("Error changing password: %s\n", err)
				return
			} else {
				fmt.Println("Password changed")
			}
		}
	},
}

func getPassword() string {
	bytePassword, _ := terminal.ReadPassword(int(syscall.Stdin))
	return strings.TrimSpace(string(bytePassword))
}
