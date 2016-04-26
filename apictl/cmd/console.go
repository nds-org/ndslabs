// Copyright © 2016 National Data Service

package cmd

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/docker/docker/pkg/term"
	"github.com/spf13/cobra"
	"golang.org/x/net/websocket"
)

// consoleCmd represents the console command
var consoleCmd = &cobra.Command{
	Use:   "console [stack service]",
	Short: "Exec into stack service container",
	Run: func(cmd *cobra.Command, args []string) {

		if len(args) < 1 {
			cmd.Usage()
			os.Exit(-1)
		}

		ssid := args[0]

		wsUrl := "ws://localhost:30001/console?namespace=" + apiUser.username + "&ssid=" + ssid
		config := websocket.Config{}
		config.Version = 13
		config.Location, _ = url.Parse(wsUrl)
		config.Header = http.Header{}
		config.Origin, _ = url.Parse(ApiServer)
		config.Header.Add("Authorization", fmt.Sprintf("Bearer %s", apiUser.token))

		ws, err := websocket.DialConfig(&config)
		if err != nil {
			fmt.Printf("Exec failed: %s\n", err)
			return
		}

		var stdin io.Reader

		stdin = os.Stdin

		if file, ok := stdin.(*os.File); ok {
			inFd := file.Fd()
			if term.IsTerminal(inFd) {
				oldState, err := term.SetRawTerminal(inFd)
				if err != nil {
					fmt.Printf("Exec failed: %s\n", err)
					return
				}
				defer term.RestoreTerminal(inFd, oldState)
				sigChan := make(chan os.Signal, 1)
				signal.Notify(sigChan, syscall.SIGTERM)
				go func() {
					<-sigChan
					term.RestoreTerminal(inFd, oldState)
					os.Exit(0)
				}()
			} else {
				fmt.Println("STDIN is not a terminal")
			}
		} else {
			fmt.Println("Unable to use PTY")
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
	},
}

func init() {
	RootCmd.AddCommand(consoleCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// consoleCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// consoleCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")

}
