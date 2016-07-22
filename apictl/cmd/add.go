// Copyright © 2016 National Data Service

package cmd

import (
	"encoding/json"
	"fmt"
	api "github.com/ndslabs/apiserver/types"
	"github.com/spf13/cobra"
	"io/ioutil"
	"os"
	"strings"
	"text/tabwriter"
)

var (
	opts    string
	file    string
	dir     string
	catalog string
	update  bool
)

func init() {
	RootCmd.AddCommand(addCmd)
	addCmd.AddCommand(addStackCmd)
	addCmd.AddCommand(addAccountCmd)
	addCmd.AddCommand(addServiceCmd)
	addCmd.AddCommand(addMountCmd)
	addCmd.AddCommand(addTagCmd)

	// add stack flags
	addStackCmd.Flags().StringVar(&opts, "opt", "", "Comma-delimited list of optional services")

	addAccountCmd.Flags().StringVarP(&file, "file", "f", "", "Path to account definition (json)")

	addServiceCmd.Flags().StringVarP(&file, "file", "f", "", "Path to service definition (json)")
	addServiceCmd.Flags().StringVar(&dir, "dir", "", "Path to directory of service definitions (json)")
	addServiceCmd.Flags().StringVarP(&catalog, "catalog", "c", "user", "Catalog to use")
	addServiceCmd.Flags().BoolVarP(&update, "update", "u", false, "Update existing service")

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

var addMountCmd = &cobra.Command{
	Use:    "mount [stack service id] [from path] [to path]",
	Short:  "Add stack service mount points",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) < 3 {
			cmd.Usage()
			os.Exit(-1)
		}
		ssid := args[0]
		fromPath := args[1]
		toPath := args[2]

		if strings.Index(ssid, "-") <= 0 {
			fmt.Printf("Invalid stack service id (looks like a stack Id?): %s\n", ssid)
			return
		}

		sid := ssid[0:strings.Index(ssid, "-")]
		stack, err := client.GetStack(sid)
		if err != nil {
			fmt.Printf("Get stack failed: %s\n", err)
			return
		}

		ssidFound := false
		for _, stackService := range stack.Services {
			if stackService.Id == ssid {
				for existingFromPath, existingToPath := range stackService.VolumeMounts {
					if existingToPath == toPath {
						delete(stackService.VolumeMounts, existingFromPath)
					}
				}
				if len(fromPath) > 0 {
					stackService.VolumeMounts[fromPath] = toPath
				}
				ssidFound = true
			}
		}
		if !ssidFound {
			fmt.Printf("No such stack service id %s\n", ssid)
		}
		err = client.UpdateStack(stack)
		if err != nil {
			fmt.Printf("Error updating stack: %s\n", err)
			return
		}
		if Verbose {
			data, err := json.MarshalIndent(stack, "", "   ")
			if err != nil {
				fmt.Printf("Error marshalling stack %s\n", err.Error)
				return
			}

			fmt.Println(string(data))
		}

	},
	PostRun: RefreshToken,
}

var addTagCmd = &cobra.Command{
	Use:    "tag [service id] [tag]",
	Short:  "Add service tag",
	PreRun: Connect,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) < 3 {
			cmd.Usage()
			os.Exit(-1)
		}
		sid := args[0]
		tagId := args[1]

		spec, err := client.GetService(sid)
		if err != nil {
			fmt.Printf("Get service spec failed: %s\n", err)
			return
		}

		if len(spec.Tags) == 0 {
			spec.Tags = []string{}
		}
		spec.Tags = append(spec.Tags, tagId)

		_, err = client.AddService(spec, client.Token, catalog, true)
		if err != nil {
			fmt.Printf("Error updating stack: %s\n", err)
			return
		}
		if Verbose {
			data, err := json.MarshalIndent(spec, "", "   ")
			if err != nil {
				fmt.Printf("Error marshalling spec %s\n", err.Error)
				return
			}

			fmt.Println(string(data))
		}

	},
	PostRun: RefreshToken,
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

	if service != nil {
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
	} else {
		fmt.Printf("Warning: unable to find service with key %s\n", stackKey)
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
	if service == nil {
		fmt.Println("Warning: unable to find service with key %s\n", serviceKey)
		return
	}
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
	if catalog == "system" {
		password := credentials("Admin password: ")
		t, err := client.Login("admin", password)
		if err != nil {
			fmt.Printf("Unable to add service %s: %s \n", service.Label, err)
			return
		}
		token = t
	}

	_, err := client.AddService(&service, token, catalog, update)
	if err != nil {
		fmt.Printf("Unable to add/update service %s: %s \n", service.Label, err)
	} else {
		fmt.Println("Added/updated service " + service.Label)
	}
}

func stringToMap(str string) map[string]string {
	nvMap := make(map[string]string)
	if len(str) > 0 {
		nvpairs := strings.Split(str, ",")
		fmt.Println("%s\n", nvpairs)
		for _, nvpair := range nvpairs {
			nv := strings.Split(nvpair, "=")
			fmt.Println("%s=%s\n", nv[0], nv[1])
			nvMap[nv[0]] = nv[1]
		}
	}
	return nvMap
}
