// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"os"
)

func init() {
	RootCmd.AddCommand(renameCmd)
}

var renameCmd = &cobra.Command{
	Use:    "rename [app id] [new name]",
	Short:  "Rename the app",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) < 2 {
			cmd.Usage()
			os.Exit(-1)
		}
		sid := args[0]
		name := args[1]

		_, err := client.GetStack(sid)
		if err != nil {
			fmt.Printf("Get app failed: %s\n", err)
			return
		}

		err = client.RenameStack(sid, name)
		if err != nil {
			fmt.Printf("Rename app failed: %s\n", err)
			return
		}

	},
	PostRun: RefreshToken,
}
