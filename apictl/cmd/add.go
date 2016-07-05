// Copyright © 2016 National Data Service

package cmd

import (
	"encoding/json"
	"fmt"
	api "github.com/ndslabs/apiserver/types"
	"github.com/spf13/cobra"
	"io/ioutil"
	"os"
	"strconv"
	"strings"
	"text/tabwriter"
)

var (
	opts    string
	file    string
	dir     string
	catalog string
)

func init() {
	RootCmd.AddCommand(addCmd)
	addCmd.AddCommand(addStackCmd)
	addCmd.AddCommand(addAccountCmd)
	addCmd.AddCommand(addServiceCmd)
	addCmd.AddCommand(addVolumeCmd)

	// add stack flags
	addStackCmd.Flags().StringVar(&opts, "opt", "", "Comma-delimited list of optional services")

	addAccountCmd.Flags().StringVarP(&file, "file", "f", "", "Path to account definition (json)")

	addServiceCmd.Flags().StringVarP(&file, "file", "f", "", "Path to service definition (json)")
	addServiceCmd.Flags().StringVar(&dir, "dir", "", "Path to directory of service definitions (json)")
	addServiceCmd.Flags().StringVarP(&catalog, "catalog", "c", "user", "Catalog to use")

}

var addCmd = &cobra.Command{
	Use:   "add [resource] [args]",
	Short: "Add a resource",
}

var addAccountCmd = &cobra.Command{
	Use:    "account [name] [password]",
	Short:  "Add the specified account (admin users only)",
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
		} else if len(args) == 2 {
			account.Id = args[0]
			account.Name = args[0]
			account.Namespace = args[0]
			account.Password = args[1]
			//account.StorageQuota =
			//account.Description =
			//account.EmailAddress =
		} else {
			cmd.Usage()
			os.Exit(-1)
		}
		addAccount(account)
	},
}

var addServiceCmd = &cobra.Command{
	Use:    "service",
	Short:  "Add the specified service (admin users only)",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {

		if len(file) > 0 {
			addServiceFile(file, catalog)
		} else if len(dir) > 0 {
			addServiceDir(dir, catalog)
		} else {
			cmd.Usage()
			os.Exit(-1)
		}
	},
}

func addServiceFile(path string, catalog string) error {
	service := api.ServiceSpec{}
	data, err := ioutil.ReadFile(path)
	if err != nil {
		fmt.Println(err)
		return err
	}

	if len(path) > 4 && path[len(path)-4:len(path)] != "json" {
		fmt.Println("Expecting extension .json")
		return nil
	}
	err = json.Unmarshal(data, &service)
	if err != nil {
		fmt.Println(err)
		return err
	}
	addService(service, catalog)
	return nil
}

func addServiceDir(path string, catalog string) error {
	files, err := ioutil.ReadDir(path)
	if err != nil {
		return err
	}

	for _, file := range files {
		if file.IsDir() {
			addServiceDir(fmt.Sprintf("%s/%s", path, file.Name()), catalog)
		} else {
			addServiceFile(fmt.Sprintf("%s/%s", path, file.Name()), catalog)
		}
	}
	return nil
}

var addStackCmd = &cobra.Command{
	Use:    "stack [serviceKey] [name]",
	Short:  "Add the specified stack to your account",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) < 2 {
			cmd.Usage()
			os.Exit(-1)
		}
		addStack(args[0], args[1], opts)
	},
}

var addVolumeCmd = &cobra.Command{
	Use:    "volume [name] [size] [stack service Id]",
	Short:  "Create a volume",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) < 2 {
			cmd.Usage()
			os.Exit(-1)
		}

		name := args[0]
		size, err := strconv.Atoi(args[1])
		if err != nil {
			fmt.Printf("Error creating volume: %s\n", err.Error())
			return
		}

		volume := api.Volume{}
		volume.Name = name
		volume.Size = size
		volume.SizeUnit = "GB"
		if len(args) == 3 {
			ssid := args[2]
			if strings.Index(ssid, "-") <= 0 {
				fmt.Printf("Invalid stack service id (looks like a stack Id?): %s\n", ssid)
				return
			}
			volume.Attached = ssid
		}

		vol, err := client.AddVolume(&volume)
		if err != nil {
			fmt.Printf("Error creating volume: %s\n", err.Error())
			return
		} else {
			fmt.Printf("Created volume %s\n", vol.Name)
		}
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

func addStack(serviceKey string, name string, opt string) {

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

	stackp, err := client.AddStack(&stack)
	if err != nil {
		fmt.Printf("Error adding stack: %s\n", err)
		return
	} else {
		fmt.Println("Added stack " + stackp.Id)

		w := new(tabwriter.Writer)
		w.Init(os.Stdout, 20, 30, 0, '\t', 0)
		fmt.Fprintln(w, "SERVICE\tSID")
		for _, stackService := range stackp.Services {
			fmt.Fprintf(w, "%s\t%s\n", stackService.Service, stackService.Id)
		}
		w.Flush()
	}
}

func addAccount(account api.Account) {

	password := credentials("Admin password: ")
	token, err := client.Login("admin", password)
	if err != nil {
		fmt.Printf("Unable to add account %s: %s \n", account.Id, err)
		return
	}

	err = client.AddAccount(&account, token)
	if err != nil {
		fmt.Printf("Unable to add account %s: %s \n", account.Id, err)
	} else {
		fmt.Println("Added account " + account.Id)
	}
}

func addService(service api.ServiceSpec, catalog string) {

	token := client.Token
	if catalog == "global" {
		password := credentials("Admin password: ")
		t, err := client.Login("admin", password)
		if err != nil {
			fmt.Printf("Unable to add service %s: %s \n", service.Label, err)
			return
		}
		token = t
	}

	_, err := client.AddService(&service, token, catalog)
	if err != nil {
		fmt.Printf("Unable to add service %s: %s \n", service.Label, err)
	} else {
		fmt.Println("Added service " + service.Label)
	}
}
