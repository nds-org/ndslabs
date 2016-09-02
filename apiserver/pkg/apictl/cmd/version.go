// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"

	version "github.com/ndslabs/apiserver/pkg/version"
	"github.com/spf13/cobra"
)

// versionCmd represents the version command
var versionCmd = &cobra.Command{
	Use:    "version",
	Short:  "Prints the client and server versions",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		serverVersion, err := client.Version()
		if err != nil {
			fmt.Printf("Error getting server: %s\n", err)
			return
		}
		fmt.Printf("Client version %s %s\n", version.VERSION, version.BUILD_DATE)
		fmt.Printf("Server version %s\n", serverVersion)
	},
}

func init() {
	RootCmd.AddCommand(versionCmd)
}
