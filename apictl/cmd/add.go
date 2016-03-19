// Copyright © 2016 National Data Service

package cmd

import (
	"encoding/json"
	"fmt"
	api "github.com/nds-labs/apiserver/types"
	"github.com/spf13/cobra"
	"io/ioutil"
	"os"
	"strings"
	"text/tabwriter"
)

var (
	opts string
	file string
	dir  string
)

func init() {
	RootCmd.AddCommand(addCmd)
	addCmd.AddCommand(addStackCmd)
	addCmd.AddCommand(addProjectCmd)
	addCmd.AddCommand(addServiceCmd)

	// add stack flags
	addStackCmd.Flags().StringVar(&opts, "opt", "", "Comma-delimited list of optional services")

	addProjectCmd.Flags().StringVarP(&file, "file", "f", "", "Path to project definition (json)")

	addServiceCmd.Flags().StringVarP(&file, "file", "f", "", "Path to service definition (json)")
	addServiceCmd.Flags().StringVar(&dir, "dir", "", "Path to service definition (json)")
}

var addCmd = &cobra.Command{
	Use:   "add [resource] [args]",
	Short: "Add a resource",
}

var addProjectCmd = &cobra.Command{
	Use:    "project [name] [password]",
	Short:  "Add the specified project (admin users only)",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		project := api.Project{}
		if len(file) > 0 {
			data, err := ioutil.ReadFile(file)
			if err != nil {
				fmt.Printf("Error reading project file: %s\n", err.Error())
				os.Exit(-1)
			}
			json.Unmarshal(data, &project)
		} else if len(args) == 2 {
			project.Id = args[0]
			project.Name = args[0]
			project.Namespace = args[0]
			project.Password = args[1]
			//project.StorageQuota =
			//project.Description =
			//project.EmailAddress =
		} else {
			cmd.Usage()
			os.Exit(-1)
		}
		addProject(project)
	},
}

var addServiceCmd = &cobra.Command{
	Use:    "service",
	Short:  "Add the specified service (admin users only)",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		if len(file) > 0 {
			addServiceFile(file)
		} else if len(dir) > 0 {
			addServiceDir(dir)
		} else {
			cmd.Usage()
			os.Exit(-1)
		}
	},
}

func addServiceFile(path string) error {
	if path[len(path)-4:len(path)] != "json" {
		return nil
	}
	service := api.ServiceSpec{}
	data, err := ioutil.ReadFile(path)
	if err != nil {
		fmt.Println(err)
		return err
	}
	err = json.Unmarshal(data, &service)
	if err != nil {
		fmt.Println(err)
		return err
	}
	addService(service)
	return nil
}

func addServiceDir(path string) error {
	files, err := ioutil.ReadDir(path)
	if err != nil {
		return err
	}

	for _, file := range files {
		if file.IsDir() {
			addServiceDir(fmt.Sprintf("%s/%s", path, file.Name()))
		} else {
			addServiceFile(fmt.Sprintf("%s/%s", path, file.Name()))
		}
	}
	return nil
}

var addStackCmd = &cobra.Command{
	Use:    "stack [serviceKey] [name]",
	Short:  "Add the specified stack to your project",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) < 2 {
			cmd.Usage()
			os.Exit(-1)
		}
		addStack(apiUser.username, args[0], args[1], opts)
	},
}

func contains(s []string, e string) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}

func addRequiredDependencies(stackKey string, stack *api.Stack) {

	service, _ := client.GetService(stackKey)

	for _, depends := range service.Dependencies {
		if depends.Required {
			stackService := api.StackService{}
			stackService.Service = depends.DependencyKey
			if !containsService(stack.Services, stackService) {
				stack.Services = append(stack.Services, stackService)
				//fmt.Printf("Adding required dependency %s\n", depends.DependencyKey)
				addRequiredDependencies(depends.DependencyKey, stack)
			}
		}
	}
}

func containsService(list []api.StackService, service api.StackService) bool {
	exists := false
	for _, item := range list {
		if item.Service == service.Service {
			exists = true
			break
		}
	}
	return exists
}

func addStack(project string, serviceKey string, name string, opt string) {

	service, _ := client.GetService(serviceKey)
	optional := strings.Split(opt, ",")

	// Add this service
	stack := api.Stack{}
	stack.Key = serviceKey
	stack.Name = name

	stackService := api.StackService{}
	stackService.Service = serviceKey
	stack.Services = append(stack.Services, stackService)

	addRequiredDependencies(serviceKey, &stack)

	for _, depends := range service.Dependencies {
		if contains(optional, depends.DependencyKey) {
			stackService = api.StackService{}
			stackService.Service = depends.DependencyKey
			stack.Services = append(stack.Services, stackService)
			addRequiredDependencies(depends.DependencyKey, &stack)
		}
	}

	err := client.AddStack(project, &stack)
	if err != nil {
		fmt.Printf("Error adding stack: %s\n", err)
		return
	} else {
		fmt.Println("Added stack " + serviceKey)

		w := new(tabwriter.Writer)
		w.Init(os.Stdout, 20, 30, 0, '\t', 0)
		fmt.Fprintln(w, "SERVICE\tSID")
		for _, stackService := range stack.Services {
			fmt.Fprintf(w, "%s\t%s\n", stackService.Service, stackService.Id)
		}
		w.Flush()
	}
}

func addProject(project api.Project) {

	err := client.AddProject(&project)
	if err != nil {
		fmt.Printf("Unable to add project %s: %s \n", project.Id, err)
	} else {
		fmt.Println("Added project " + project.Id)
	}
}

func addService(service api.ServiceSpec) {

	_, err := client.AddService(&service)
	if err != nil {
		fmt.Printf("Unable to add service %s: %s \n", service.Label, err)
	} else {
		fmt.Println("Added service " + service.Label)
	}
}
