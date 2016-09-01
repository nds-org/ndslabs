// Copyright © 2016 National Data Service

package cmd

import (
	"encoding/json"
	"fmt"
	"github.com/spf13/cobra"
	"os"
	"text/tabwriter"
)

// listCmd represents the list command
var listCmd = &cobra.Command{
	Use:   "list",
	Short: "List available services or resources",
}

var listServicesCmd = &cobra.Command{
	Use:    "services",
	Short:  "List available services",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		services, err := client.ListServices(catalog)
		if err != nil {
			fmt.Printf("Error listing services: %s\n", err)
			return
		}

		w := new(tabwriter.Writer)
		w.Init(os.Stdout, 15, 4, 3, ' ', 0)
		fmt.Fprintln(w, "SERVICE\tDEPENDENCY\tREQUIRED\tCATALOG")
		for _, service := range *services {
			if service.Display != "" {
				fmt.Fprintf(w, "%s\t\t\t%s\n", service.Key, service.Catalog)
				for _, dependency := range service.Dependencies {
					if dependency.Required {
						fmt.Fprintf(w, "\t%s\tYes\n", dependency.DependencyKey)
					} else {
						fmt.Fprintf(w, "\t%s\tNo\n", dependency.DependencyKey)
					}
				}
			}
		}
		w.Flush()
	},
	PostRun: RefreshToken,
}

var listStacksCmd = &cobra.Command{
	Use:    "apps",
	Short:  "List existing apps",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		stacks, err := client.ListStacks()
		if err != nil {
			fmt.Printf("List failed: %s\n", err)
			os.Exit(-1)
		}
		w := new(tabwriter.Writer)
		w.Init(os.Stdout, 10, 4, 3, ' ', 0)
		fmt.Fprintln(w, "STACK\tSERVICE\tSTATUS\tSID\tENDPOINT\tMESSAGE")
		for _, stack := range *stacks {

			fmt.Fprintf(w, "%s\t\t%s\t%s\n", stack.Name, stack.Status, stack.Id)
			for _, service := range stack.Services {
				endpoint := ""
				if len(service.Endpoints) > 0 {
					ep := service.Endpoints[0]
					if len(ep.Host) > 0 {
						endpoint = ep.Host
					}
				}

				message := ""
				if len(service.StatusMessages) > 0 {
					message = service.StatusMessages[len(service.StatusMessages)-1]
				}
				fmt.Fprintf(w, "\t%s\t%s\t%s\t%s\t%s\n", service.Service, service.Status, service.Id, endpoint, message)
			}
		}
		w.Flush()
		if Verbose {
			data, _ := json.MarshalIndent(stacks, "", "   ")
			fmt.Println(string(data))
		}
	},
	PostRun: RefreshToken,
}

var listAccountsCmd = &cobra.Command{
	Use:    "accounts",
	Short:  "List existing accounts (admin users only)",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		accounts, err := client.ListAccounts()
		if err != nil {
			fmt.Printf("List failed: %s\n", err)
			os.Exit(-1)
		}

		w := new(tabwriter.Writer)
		w.Init(os.Stdout, 10, 4, 3, ' ', 0)
		fmt.Fprintln(w, "NAMESPACE\tSTORAGE\tCPU (Max)\tCPU (Default)\tMEMORY (Max)\tMEMORY (Default)\tDESCRIPTION")
		for _, account := range *accounts {
			fmt.Fprintf(w, "%s\t%d\t%d\t%d\t%d\t%d\t%s\n", account.Namespace,
				account.ResourceLimits.StorageQuota,
				account.ResourceLimits.CPUMax,
				account.ResourceLimits.CPUDefault,
				account.ResourceLimits.MemoryMax,
				account.ResourceLimits.MemoryDefault,
				account.Description)
		}
		w.Flush()

	},
	PostRun: RefreshToken,
}

var listConfigsCmd = &cobra.Command{
	Use:    "configs [service keys]",
	Short:  "List service configs",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}
		configs, err := client.GetConfigs(args)
		if err != nil {
			fmt.Printf("List failed: %s\n", err)
			os.Exit(-1)
		}

		if configs != nil {
			for sid, cfg := range *configs {
				fmt.Println(sid)
				data, _ := json.MarshalIndent(cfg, "", "   ")
				fmt.Println(string(data))
			}
		}

	},
	PostRun: RefreshToken,
}

func init() {
	RootCmd.AddCommand(listCmd)

	listServicesCmd.Flags().StringVarP(&catalog, "catalog", "c", "user", "Catalog to use")

	listCmd.AddCommand(listServicesCmd)
	listCmd.AddCommand(listStacksCmd)
	listCmd.AddCommand(listAccountsCmd)
	listCmd.AddCommand(listConfigsCmd)
}
