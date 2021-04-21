// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"golang.org/x/crypto/ssh/terminal"
	"io/ioutil"
	"os"
	"strings"
	"syscall"
)

var (
	passwd string
)

// loginCmd represents the login command
var loginCmd = &cobra.Command{
	Use:    "login [username]",
	Short:  "Login to the server",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}

		username := strings.TrimSpace(args[0])
		password := ""
		if passwd == "" {
			password = credentials("")
		} else {
			password = passwd
		}

		token, err := client.Login(username, password)
		if err != nil {
			fmt.Printf("Login error: %s\n", err)
		} else if token == "" {
			fmt.Printf("Login failed: no response from server\n")
		} else {
			path := os.Getenv("HOME") + "/.ndslabsctl"
			os.Mkdir(path, 0700)
			e := ioutil.WriteFile(path+"/.passwd", []byte(username+":"+token), 0644)
			if e != nil {
				fmt.Printf("Error writing passwd data: %s\n", err)
				os.Exit(-1)
			}
			fmt.Printf("Login succeeded\n")
		}
	},
}

func credentials(prompt string) string {
	if prompt == "" {
		fmt.Print("Password: ")
	} else {
		fmt.Print(prompt)
	}
	bytePassword, _ := terminal.ReadPassword(int(syscall.Stdin))
	password := string(bytePassword)
	fmt.Print("\n")

	return strings.TrimSpace(password)
}

func init() {
	loginCmd.Flags().StringVarP(&passwd, "password", "p", "", "Password to use for login (for scripting)")

	RootCmd.AddCommand(loginCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// loginCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// loginCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")

}
