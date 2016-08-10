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
	Use:    "rename [stack id] [new name]",
	Short:  "Rename the stack",
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
			fmt.Printf("Get stack failed: %s\n", err)
			return
		}

		err = client.RenameStack(sid, name)
		if err != nil {
			fmt.Printf("Rename stack failed: %s\n", err)
			return
		}

	},
	PostRun: RefreshToken,
}
