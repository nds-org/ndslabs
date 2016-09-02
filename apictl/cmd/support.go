// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"
	api "github.com/ndslabs/apiserver/types"
	"github.com/spf13/cobra"
	"os"
)

// supportCmd
var supportCmd = &cobra.Command{
	Use:    "support [type] [message]",
	Short:  "Submit a support request",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		if len(args) < 2 {
			cmd.Usage()
			os.Exit(-1)
		}

		reportType := args[0]
		message := args[1]

		if reportType != string(api.BugRequestType) &&
			reportType != string(api.WishRequestType) &&
			reportType != string(api.CommentRequestType) &&
			reportType != string(api.HelpRequestType) {
			fmt.Println("Invalid request type. Must be one of bug, wish, help, or comment")
			return
		}

		request := &api.SupportRequest{
			Type:    api.SupportRequestType(reportType),
			Message: message,
		}
		err := client.SupportRequest(request)
		if err != nil {
			fmt.Printf("Request failed: %s\n", err.Error())
			return
		}
	},
}

func init() {
	RootCmd.AddCommand(supportCmd)
}
