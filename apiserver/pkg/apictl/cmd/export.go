// Copyright © 2016 National Data Service

package cmd

import (
	"encoding/json"
	"fmt"
	"github.com/spf13/cobra"
	"os"
)

var exportCmd = &cobra.Command{
	Use:    "export [userId]",
	Short:  "Export account settings for user (admin only)",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}
		userId := args[0]

		expPkg, err := client.Export(userId)
		if err != nil {
			fmt.Printf("Export failed: %s\n", err)
			return
		}

		data, err := json.MarshalIndent(expPkg, "", "   ")
		if err != nil {
			fmt.Printf("Error marshalling account information %s\n", err.Error)
			return
		}
		fmt.Println(string(data))
	},
	PostRun: RefreshToken,
}

func init() {
	RootCmd.AddCommand(exportCmd)
}
