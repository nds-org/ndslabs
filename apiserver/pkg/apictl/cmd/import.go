// Copyright © 2016 National Data Service

package cmd

import (
	"encoding/json"
	"fmt"
	api "github.com/ndslabs/apiserver/pkg/types"
	"github.com/spf13/cobra"
	"io/ioutil"
	"os"
)

func init() {
	RootCmd.AddCommand(importCmd)
	importCmd.Flags().StringVarP(&file, "file", "f", "", "Path to export file (json)")
}

var importCmd = &cobra.Command{
	Use:    "import ",
	Short:  "Import the specified account (admin user only)",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		expPkg := api.ExportPackage{}
		if len(file) > 0 {
			data, err := ioutil.ReadFile(file)
			if err != nil {
				fmt.Printf("Error reading export file: %s\n", err.Error())
				os.Exit(-1)
			}
			json.Unmarshal(data, &expPkg)
		} else {
			cmd.Usage()
			os.Exit(-1)
		}
		err := client.Import(&expPkg)
		if err != nil {
			fmt.Printf("Unable to import account %s: %s \n", expPkg.Account.Id, err)
		} else {
			fmt.Println("Imported account " + expPkg.Account.Id)
		}
	},
}
