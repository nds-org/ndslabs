// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"sync"

	"github.com/spf13/cobra"
	"golang.org/x/net/websocket"
)

// execCmd represents the exec command
var execCmd = &cobra.Command{
	Use:   "exec [stack service]",
	Short: "Exec into stack service container",
	Run: func(cmd *cobra.Command, args []string) {

		if len(args) < 1 {
			cmd.Usage()
			os.Exit(-1)
		}

		ssid := args[0]

		wsUrl := "ws://localhost:30001/exec?namespace=" + apiUser.username + "&ssid=" + ssid
		config := websocket.Config{}
		config.Version = 13
		config.Location, _ = url.Parse(wsUrl)
		config.Header = http.Header{}
		config.Origin, _ = url.Parse(ApiServer)
		config.Header.Add("Authorization", fmt.Sprintf("Bearer %s", apiUser.token))

		ws, err := websocket.DialConfig(&config)
		if err != nil {
			fmt.Printf("%s\n", err)
			return
		}

		var wg sync.WaitGroup

		go func() {
			if _, err := io.Copy(ws, os.Stdin); err != nil {
				if err != nil {
					fmt.Printf("%s\n", err)
				}
			}
		}()

		wg.Add(1)
		go func() {
			defer wg.Done()
			if _, err := io.Copy(os.Stdout, ws); err != nil {
				if err != nil {
					fmt.Printf("%s\n", err)
				}
			}
		}()
		wg.Wait()

		/*
			reader := bufio.NewReader(os.Stdin)
			buflen, err := reader.Read(
			if _, err := ws.Write([]byte("hello, world\n")); err != nil {
				log.Fatal(err)
			}
			var msg = make([]byte, 512)
			var n int
			if n, err = ws.Read(msg); err != nil {
				log.Fatal(err)
			}
			log.Printf("Received: %s.", msg[:n])
		*/
	},
}

func init() {
	RootCmd.AddCommand(execCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// execCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// execCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")

}
