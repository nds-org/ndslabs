// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"
	"os"
	"os/user"

	"github.com/spf13/cobra"
)

// logoutCmd represents the logout command
var logoutCmd = &cobra.Command{
	Use:    "logout",
	Short:  "Logout the current user",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		usr, err := user.Current()
		if err != nil {
			fmt.Printf("Error looking up current OS user %s\n", err)
			os.Exit(-1)
		}
		path := usr.HomeDir + "/.apictl"
		err = os.Remove(path + "/.passwd")
		if err != nil {
			fmt.Printf("Error removing passwd data: %s\n", err)
			os.Exit(-1)
		}
	},
}

func init() {
	RootCmd.AddCommand(logoutCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// logoutCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// logoutCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")

}
