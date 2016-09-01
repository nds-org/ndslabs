// Copyright © 2016 National Data Service

package cmd

import (
	"encoding/json"
	"fmt"
	"github.com/spf13/cobra"
	"os"
	"strings"
)

var setCmd = &cobra.Command{
	Use:   "set",
	Short: "Set optional app values",
}

func init() {
	RootCmd.AddCommand(setCmd)
	setCmd.AddCommand(setEnvCmd)
	setCmd.AddCommand(setPasswordCmd)
}

var setEnvCmd = &cobra.Command{
	Use:    "env [app service id] [var name] [var value]",
	Short:  "Set app service environment values",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) < 3 {
			cmd.Usage()
			os.Exit(-1)
		}
		ssid := args[0]
		varName := args[1]
		varValue := args[2]

		if strings.Index(ssid, "-") <= 0 {
			fmt.Printf("Invalid app service id (looks like a app Id?): %s\n", ssid)
			return
		}

		sid := ssid[0:strings.Index(ssid, "-")]
		stack, err := client.GetStack(sid)
		if err != nil {
			fmt.Printf("Get app failed: %s\n", err)
			return
		}

		ssidFound := false
		for i, stackService := range stack.Services {
			if stackService.Id == ssid {
				spec, err := client.GetService(stackService.Service)
				if err != nil {
					fmt.Printf("Error getting service spec %s\n", err.Error)
				}
				if stackService.Config == nil {
					stackService.Config = make(map[string]string)
				}
				found := false
				for _, config := range spec.Config {
					if config.Name == varName {
						if config.CanOverride {
							fmt.Printf("%s %s %t\n", varName, varValue, config.CanOverride)
							stackService.Config[varName] = varValue
							found = true
						} else {
							fmt.Printf("Cannot override variable %s\n", varName)
							return
						}
					}
				}
				if !found {
					// Custom variable
					stackService.Config[varName] = varValue
				}
				stack.Services[i] = stackService
				ssidFound = true
			}
		}
		if !ssidFound {
			fmt.Printf("No such app service id %s\n", ssid)
		}
		err = client.UpdateStack(stack)
		if err != nil {
			fmt.Printf("Error updating app: %s\n", err)
			return
		}
		if Verbose {
			data, err := json.MarshalIndent(stack, "", "   ")
			if err != nil {
				fmt.Printf("Error marshalling app %s\n", err.Error)
				return
			}

			fmt.Println(string(data))
		}

	},
	PostRun: RefreshToken,
}

var setPasswordCmd = &cobra.Command{
	Use:    "passwd",
	Short:  "Set the password for this account",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		newPassword := credentials("Enter new password: ")
		confirm := credentials("Enter again: ")

		if newPassword != confirm {
			fmt.Printf("Passwords do not match\n")
			return
		}

		err := client.ChangePassword(newPassword)
		if err != nil {
			fmt.Printf("Error changing password %s\n", err)
			return
		} else {
			fmt.Printf("Password changed\n")
		}

	},
	PostRun: RefreshToken,
}
