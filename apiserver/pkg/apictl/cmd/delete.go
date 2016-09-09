// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"os"
)

func init() {
	deleteServiceCmd.Flags().StringVarP(&catalog, "catalog", "c", "user", "Catalog to use")
	RootCmd.AddCommand(deleteCmd)
	deleteCmd.AddCommand(deleteStackCmd)
	deleteCmd.AddCommand(deleteAccountCmd)
	deleteCmd.AddCommand(deleteServiceCmd)
}

var deleteCmd = &cobra.Command{
	Use:   "delete",
	Short: "Delete a resource",
}

var deleteStackCmd = &cobra.Command{
	Use:    "app [stackName]",
	Short:  "Remove a app",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}

		deleteStack(args[0])
	},
}

var deleteAccountCmd = &cobra.Command{
	Use:    "account [accountId]",
	Short:  "Remove a account (admin users only)",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}

		deleteAccount(args[0])
	},
}

var deleteServiceCmd = &cobra.Command{
	Use:    "service [serviceId]",
	Short:  "Remove a service (admin users only)",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}

		deleteService(args[0], catalog)
	},
}

func deleteService(service string, catalog string) {

	err := client.DeleteService(service, catalog)
	if err != nil {
		fmt.Printf("Unable to delete service %s: %s \n", service, err)
	} else {
		fmt.Printf("Service %s deleted\n", service)
	}
}

func deleteAccount(account string) {

	err := client.DeleteAccount(account)
	if err != nil {
		fmt.Printf("Unable to delete account %s: %s \n", account, err)
	} else {
		fmt.Printf("Account %s deleted\n", account)
	}
}

func deleteStack(stack string) {
	err := client.DeleteStack(stack)
	if err != nil {
		fmt.Printf("Unable to delete app %s: %s \n", stack, err)
	} else {
		fmt.Printf("App %s deleted\n", stack)
	}
}
