// Copyright © 2016 National Data Service

package cmd

import (
	"encoding/json"
	"fmt"
	"github.com/spf13/cobra"
	"os"
)

// quickstartCmd represents the quickstart command
var quickstartCmd = &cobra.Command{
	Use:    "quickstart [serviceKey]",
	Short:  "Start an app",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}

		key := args[0]

		stack, err := client.QuickStartStack(key)
		if err != nil {
			fmt.Printf("Error starting %s: %s\n", key, err)
		} else {
			fmt.Printf("Started %s\n%s\n", stack.Id, stack.Services[0].Endpoints[0].URL)
			if Verbose {
				data, _ := json.MarshalIndent(stack, "", "   ")
				fmt.Println(string(data))
			}
		}
	},
}

func init() {
	RootCmd.AddCommand(quickstartCmd)
}
