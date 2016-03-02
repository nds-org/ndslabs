// Copyright © 2016 NAME HERE <EMAIL ADDRESS>
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package cmd

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/user"
	"strings"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var apiServer string //= "http://141.142.209.154:8083/"

var cfgFile string

type User struct {
	username string
	token    string
}

var apiUser User

// This represents the base command when called without any subcommands
var RootCmd = &cobra.Command{
	Use:   "apictl",
	Short: "NDS Labs API server CLI",
}

func RefreshToken(cmd *cobra.Command, args []string) {

	url := apiServer + "refresh_token"
	client := &http.Client{}
	request, err := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiUser.token))
	resp, err := client.Do(request)
	if err != nil {
		fmt.Printf("Error in call to refresh_token: %s\n", err)
		os.Exit(-1)
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()

			body, err := ioutil.ReadAll(resp.Body)

			err = json.Unmarshal(body, &jwt)
			token := jwt["token"].(string)
			if err != nil {
				log.Fatal(err)
			}
			writePasswd(token)
		} else {
			//fmt.Printf("Login failed: %s \n", resp.Status)
		}
	}
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
	path := usr.HomeDir + "/.apictl/.passwd"
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
	path := usr.HomeDir + "/.apictl"
	os.Mkdir(path, 0700)
	err := ioutil.WriteFile(path+"/.passwd", []byte(apiUser.username+":"+token), 0644)
	if err != nil {
		fmt.Printf("Error writing passwd file: %s\n", err)
		os.Exit(-1)
	}
}

func init() {
	cobra.OnInitialize(initConfig)

	readPasswd()

	// Here you will define your flags and configuration settings.
	// Cobra supports Persistent Flags, which, if defined here,
	// will be global for your application.

	RootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.apictl.yaml)")
	RootCmd.PersistentFlags().StringVar(&apiServer, "host", "http://localhost:8083/", "API server host address")
	// Cobra also supports local flags, which will only run
	// when this action is called directly.
	RootCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}

// initConfig reads in config file and ENV variables if set.
func initConfig() {
	if cfgFile != "" { // enable ability to specify config file via flag
		viper.SetConfigFile(cfgFile)
	}

	viper.SetConfigName(".apictl") // name of config file (without extension)
	viper.AddConfigPath("$HOME")   // adding home directory as first search path
	viper.AutomaticEnv()           // read in environment variables that match

	// If a config file is found, read it in.
	if err := viper.ReadInConfig(); err == nil {
		fmt.Println("Using config file:", viper.ConfigFileUsed())
	}
}
