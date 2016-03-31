// Copyright © 2016 National Data Service

package cmd

import (
	"encoding/json"
	"fmt"
	"github.com/spf13/cobra"
	"os"
	"strings"
)

var getCmd = &cobra.Command{
	Use:   "get",
	Short: "Get service or resource details",
}

var getServiceCmd = &cobra.Command{
	Use:    "service",
	Short:  "Get service details",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}
		sid := args[0]

		service, err := client.GetService(sid)
		if err != nil {
			fmt.Printf("Get service failed: %s\n", err)
			return
		}

		data, err := json.MarshalIndent(service, "", "   ")
		if err != nil {
			fmt.Printf("Error marshalling service spec %s\n", err.Error)
			return
		}
		fmt.Println(string(data))
	},
	PostRun: RefreshToken,
}

var getStackCmd = &cobra.Command{
	Use:    "stack [stack Id]",
	Short:  "Get stack details",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}
		sid := args[0]

		if strings.Index(sid, "-") > 0 {
			fmt.Printf("Invalid stack id (looks like a stack service Id?): %s\n", sid)
			return
		}

		stack, err := client.GetStack(apiUser.username, sid)
		if err != nil {
			fmt.Printf("Get stack failed: %s\n", err)
			return
		}

		data, err := json.MarshalIndent(stack, "", "   ")
		if err != nil {
			fmt.Printf("Error marshalling stack %s\n", err.Error)
			return
		}
		fmt.Println(string(data))

		fmt.Println("\nSID\tCONFIG")

		for _, service := range stack.Services {

			spec, _ := client.GetService(service.Service)
			if len(spec.Config) > 0 {

				for _, config := range spec.Config {
					name := config.Name
					value := config.Value
					if config.CanOverride {
						if val, ok := service.Config[name]; ok {
							value = val
						}
						fmt.Printf("%s\t%s=%s\n", service.Id, name, value)
					}
				}
			}
		}
	},
	PostRun: RefreshToken,
}

var getProjectCmd = &cobra.Command{
	Use:    "project",
	Short:  "Get project details",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		if len(args) == 1 && args[0] != apiUser.username {
			// Trying to get another project, needs to be admin
			password := credentials("Admin password: ")
			token, err := client.Login("admin", password)
			if err != nil {
				fmt.Printf("Unable to get project: %s \n", err)
				return
			}

			project, err := client.GetProjectAdmin(args[0], token)
			if err != nil {
				fmt.Printf("Unable to get project: %s\n", err)
				os.Exit(-1)
			}

			project.Password = "REDACTED"
			data, err := json.MarshalIndent(project, "", "   ")
			if err != nil {
				fmt.Printf("Error marshalling project %s\n", err.Error)
				return
			}
			fmt.Println(string(data))
		} else {
			pid := apiUser.username

			project, err := client.GetProject(pid)
			if err != nil {
				fmt.Printf("Get project failed: %s\n", err)
				return
			}
			project.Password = "REDACTED"
			data, err := json.MarshalIndent(project, "", "   ")
			if err != nil {
				fmt.Printf("Error marshalling project %s\n", err.Error)
				return
			}
			fmt.Println(string(data))
		}

	},
	PostRun: RefreshToken,
}

func init() {
	RootCmd.AddCommand(getCmd)
	getCmd.AddCommand(getServiceCmd)
	getCmd.AddCommand(getStackCmd)
	getCmd.AddCommand(getProjectCmd)
}
