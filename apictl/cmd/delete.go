// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"os"
)

func init() {
	RootCmd.AddCommand(deleteCmd)
	deleteCmd.AddCommand(deleteStackCmd)
	deleteCmd.AddCommand(deleteVolumeCmd)
	deleteCmd.AddCommand(deleteProjectCmd)
	deleteCmd.AddCommand(deleteServiceCmd)
}

var deleteCmd = &cobra.Command{
	Use:   "delete",
	Short: "Delete a resource",
}

var deleteStackCmd = &cobra.Command{
	Use:    "stack [stackName]",
	Short:  "Remove a stack",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}

		deleteStack(apiUser.username, args[0])
	},
}

var deleteVolumeCmd = &cobra.Command{
	Use:    "volume [volumeId]",
	Short:  "Remove a volume",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}

		deleteVolume(apiUser.username, args[0])
	},
}

var deleteProjectCmd = &cobra.Command{
	Use:    "project [projectId]",
	Short:  "Remove a project (admin users only)",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			cmd.Usage()
			os.Exit(-1)
		}

		deleteProject(args[0])
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

		deleteService(args[0])
	},
}

func deleteService(service string) {
	err := client.DeleteService(service)
	if err != nil {
		fmt.Printf("Unable to delete service %s: %s \n", service, err)
	} else {
		fmt.Printf("Service %s deleted\n", service)
	}
}

func deleteProject(project string) {
	err := client.DeleteProject(project)
	if err != nil {
		fmt.Printf("Unable to delete project %s: %s \n", project, err)
	} else {
		fmt.Printf("Project %s deleted\n", project)
	}
}

func deleteVolume(project string, volume string) {
	err := client.DeleteVolume(project, volume)
	if err != nil {
		fmt.Printf("Unable to delete volume %s: %s \n", volume, err)
	} else {
		fmt.Printf("Volume %s deleted\n", volume)
	}
}

func deleteStack(project string, stack string) {
	err := client.DeleteStack(project, stack)
	if err != nil {
		fmt.Printf("Unable to delete stack %s: %s \n", stack, err)
	} else {
		fmt.Printf("Stack %s deleted\n", stack)
	}
}
