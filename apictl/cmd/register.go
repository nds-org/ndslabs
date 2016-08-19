// Copyright © 2016 National Data Service

package cmd

import (
	"encoding/json"
	"fmt"
	api "github.com/ndslabs/apiserver/types"
	"github.com/spf13/cobra"
	"io/ioutil"
	"os"
)

func init() {
	RootCmd.AddCommand(registerCmd)

	registerCmd.Flags().StringVarP(&file, "file", "f", "", "Path to account definition (json)")

}

var registerCmd = &cobra.Command{
	Use:    "register [args]",
	Short:  "Add a resource",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		account := api.Account{}
		if len(file) > 0 {
			data, err := ioutil.ReadFile(file)
			if err != nil {
				fmt.Printf("Error reading account file: %s\n", err.Error())
				os.Exit(-1)
			}
			json.Unmarshal(data, &account)
		} else {
			cmd.Usage()
			os.Exit(-1)
		}
		err := client.Register(&account)
		if err != nil {
			fmt.Printf("Unable to register account %s: %s \n", account.Id, err)
		} else {
			fmt.Println("Registered account " + account.Id)
		}
	},
}
