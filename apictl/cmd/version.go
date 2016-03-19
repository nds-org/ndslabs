// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"

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
		fmt.Printf("Client version %s %s (%s)\n", VERSION, BUILD_DATE, GIT_COMMIT)
		fmt.Printf("Server version %s\n", serverVersion)
	},
}

func init() {
	RootCmd.AddCommand(versionCmd)
}
