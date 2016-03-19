// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"golang.org/x/crypto/ssh/terminal"
	"io/ioutil"
	"os"
	"os/user"
	"strings"
	"syscall"
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
		password := credentials()
		usr, err := user.Current()
		if err != nil {
			fmt.Printf("Error looking up current OS user %s\n", err)
			os.Exit(-1)
		}

		token, err := client.Login(username, password)
		if err != nil {
			fmt.Printf("Login error: %s\n", err)
		} else if token == "" {
			fmt.Printf("Login failed: no response from server\n")
		} else {
			path := usr.HomeDir + "/.apictl"
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

func credentials() string {
	fmt.Print("Password: ")
	bytePassword, _ := terminal.ReadPassword(int(syscall.Stdin))
	password := string(bytePassword)
	fmt.Print("\n")

	return strings.TrimSpace(password)
}

func init() {
	RootCmd.AddCommand(loginCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// loginCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// loginCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")

}
