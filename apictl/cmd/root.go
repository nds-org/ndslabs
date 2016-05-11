// Copyright © 2016 National Data Service

package cmd

import (
	"crypto/tls"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"os/user"
	"strings"

	apiclient "github.com/ndslabs/apictl/client"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var ApiServer string

var Verbose bool

var client *apiclient.Client

var cfgFile string

type User struct {
	username string
	token    string
}

var apiUser User

// This represents the base command when called without any subcommands
var RootCmd = &cobra.Command{
	Use:   "ndslabsctl",
	Short: "NDS Labs API server CLI",
}

func Connect(cmd *cobra.Command, args []string) {

	server := viper.GetString("server")
	if Verbose {
		fmt.Printf("Connecting to server %s\n", server)
		//fmt.Printf("Connecting to server %s\n", ApiServer)
	}
	if strings.LastIndex(server, "/") < len(server)-1 {
		server = server + "/"
	}

	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}

	if server[0:5] == "https" {
		client = apiclient.NewClient(server, &http.Client{Transport: tr}, apiUser.token)
	} else {
		client = apiclient.NewClient(server, &http.Client{}, apiUser.token)
	}
}
func RefreshToken(cmd *cobra.Command, args []string) {

	token, err := client.RefreshToken()
	if err != nil {
		return
	}
	writePasswd(token)
}

// Execute adds all child commands to the root command sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() {
	if err := RootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(-1)
	}
}

func getCurrentUser() *user.User {
	usr, err := user.Current()
	if err != nil {
		fmt.Printf("Error getting current OS user: %s\n", err)
		os.Exit(-1)
	}
	return usr
}

func readPasswd() {
	usr := getCurrentUser()
	path := usr.HomeDir + "/.ndslabsctl/.passwd"
	dat, err := ioutil.ReadFile(path)

	if err != nil {
		//	fmt.Printf("Error reading password file: %s\n", err)
		//	os.Exit(-1)
		apiUser.username = ""
		apiUser.token = ""
	} else {
		s := strings.Split(string(dat), ":")
		apiUser.username = s[0]
		apiUser.token = s[1]
	}
}

func writePasswd(token string) {
	usr := getCurrentUser()
	path := usr.HomeDir + "/.ndslabsctl"
	os.Mkdir(path, 0700)
	err := ioutil.WriteFile(path+"/.passwd", []byte(apiUser.username+":"+token), 0644)
	if err != nil {
		fmt.Printf("Error writing passwd file: %s\n", err)
		os.Exit(-1)
	}
}

func init() {
	cobra.OnInitialize(initConfig)

	RootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.ndslabsctl.yaml)")
	RootCmd.PersistentFlags().StringVarP(&ApiServer, "server", "s", "http://localhost:30001/api", "API server host address")
	RootCmd.PersistentFlags().BoolVarP(&Verbose, "verbose", "v", false, "Verbose output")
	viper.BindPFlag("server", RootCmd.PersistentFlags().Lookup("server"))

	if RootCmd.PersistentFlags().Lookup("server").Changed {
		viper.Set("server", ApiServer)
	}
	readPasswd()
}

// initConfig reads in config file and ENV variables if set.
func initConfig() {
	if cfgFile != "" { // enable ability to specify config file via flag
		viper.SetConfigFile(cfgFile)
	}

	viper.SetConfigName(".ndslabsctl") // name of config file (without extension)
	viper.AddConfigPath("$HOME")       // adding home directory as first search path
	viper.AutomaticEnv()               // read in environment variables that match

	// If a config file is found, read it in.
	if err := viper.ReadInConfig(); err == nil {
		if Verbose {
			fmt.Println("Using config file:", viper.ConfigFileUsed())
		}
	}
}
