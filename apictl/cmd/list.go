// Copyright © 2016 National Data Service

package cmd

import (
	"encoding/json"
	"fmt"
	"github.com/spf13/cobra"
	"log"
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

		services, err := client.ListServices()
		if err != nil {
			log.Fatal(err)
		}

		w := new(tabwriter.Writer)
		w.Init(os.Stdout, 10, 4, 3, ' ', 0)
		fmt.Fprintln(w, "SERVICE\tDEPENDENCY\tREQUIRED")
		for _, service := range *services {
			if service.IsStack {
				fmt.Fprintf(w, "%s\n", service.Key)
				for _, dependency := range service.Dependencies {
					if dependency.Required {
						fmt.Fprintf(w, "\t%s\t(required)\n", dependency.DependencyKey)
					} else {
						fmt.Fprintf(w, "\t%s\t(optional)\n", dependency.DependencyKey)
					}
				}
			}
		}
		w.Flush()
	},
	PostRun: RefreshToken,
}

var listStacksCmd = &cobra.Command{
	Use:    "stacks",
	Short:  "List existing stacks",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		stacks, err := client.ListStacks(apiUser.username)
		if err != nil {
			fmt.Printf("List failed: %s\n", err)
			os.Exit(-1)
		}
		w := new(tabwriter.Writer)
		w.Init(os.Stdout, 10, 4, 3, ' ', 0)
		fmt.Fprintln(w, "STACK\tSERVICE\tSTATUS\tSID")
		for _, stack := range *stacks {

			fmt.Fprintf(w, "%s\t\t%s\t%s\n", stack.Name, stack.Status, stack.Id)
			for _, service := range stack.Services {
				//spec, _ := client.GetService(service.Service)
				fmt.Fprintf(w, "\t%s\t%s\t%s\n", service.Service, service.Status, service.Id)
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

var listVolumesCmd = &cobra.Command{
	Use:    "volumes",
	Short:  "List existing volumes",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		volumes, err := client.ListVolumes(apiUser.username)
		if err != nil {
			fmt.Printf("List failed: %s\n", err)
			os.Exit(-1)
		}

		w := new(tabwriter.Writer)
		w.Init(os.Stdout, 10, 4, 3, ' ', 0)
		fmt.Fprintln(w, "NAME\tATTACHED TO\tSIZE\tSTATUS")
		for _, volume := range *volumes {
			fmt.Fprintf(w, "%s\t%s\t%d\t%s\n", volume.Name, volume.Attached, volume.Size, volume.Status)
		}
		w.Flush()
	},
	PostRun: RefreshToken,
}

var listProjectsCmd = &cobra.Command{
	Use:    "projects",
	Short:  "List existing projects (admin users only)",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		projects, err := client.ListProjects()
		if err != nil {
			fmt.Printf("List failed: %s\n", err)
			os.Exit(-1)
		}

		w := new(tabwriter.Writer)
		w.Init(os.Stdout, 10, 4, 3, ' ', 0)
		fmt.Fprintln(w, "ID\tNAMESPACE")
		for _, project := range *projects {
			fmt.Fprintf(w, "%s\t%s\n", project.Id, project.Namespace)
		}
		w.Flush()

	},
	PostRun: RefreshToken,
}

var listConfigsCmd = &cobra.Command{
	Use:    "configs [service ids]",
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
	listCmd.AddCommand(listServicesCmd)
	listCmd.AddCommand(listStacksCmd)
	listCmd.AddCommand(listVolumesCmd)
	listCmd.AddCommand(listProjectsCmd)
	listCmd.AddCommand(listConfigsCmd)
}
