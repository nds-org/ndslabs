package client

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	api "github.com/ndslabs/apiserver/types"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"sort"
	"strings"
	"sync"
	"syscall"

	"github.com/docker/docker/pkg/term"
	"golang.org/x/net/websocket"
)

type Client struct {
	BasePath   string
	Token      string
	HttpClient *http.Client
}

func NewClient(basePath string, httpClient *http.Client, token string) *Client {
	return &Client{BasePath: basePath, HttpClient: httpClient, Token: token}
}

func (c *Client) Login(username string, password string) (string, error) {
	url := c.BasePath + "authenticate"

	data := fmt.Sprintf("{\"username\": \"%s\", \"password\": \"%s\"}", username, password)
	request, err := http.NewRequest("POST", url, bytes.NewBuffer([]byte(data)))
	if err != nil {
		return "", nil
	}
	request.Header.Set("Content-Type", "application/json")
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return "", nil
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()

			body, err := ioutil.ReadAll(resp.Body)

			jwt := make(map[string]interface{})
			err = json.Unmarshal(body, &jwt)
			token := jwt["token"].(string)
			if err != nil {
				return "", err
			}

			return token, nil
		} else {
			return "", errors.New(resp.Status)
		}
	}
}

func (c *Client) ListServices(catalog string) (*[]api.ServiceSpec, error) {

	url := c.BasePath + "services"
	if catalog != "" {
		url += "?catalog=" + catalog
	}
	request, err := http.NewRequest("GET", url, nil)

	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode == http.StatusOK {

		defer resp.Body.Close()
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		services := make([]api.ServiceSpec, 0)
		json.Unmarshal([]byte(body), &services)
		sort.Sort(api.ServiceSorter(services))
		return &services, nil
	} else {
		err := errors.New(resp.Status)
		return nil, err
	}
}

func (c *Client) RefreshToken() (string, error) {

	url := c.BasePath + "refresh_token"
	request, err := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return "", err
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()

			body, err := ioutil.ReadAll(resp.Body)

			jwt := make(map[string]interface{})

			err = json.Unmarshal(body, &jwt)
			token := jwt["token"].(string)
			if err != nil {
				return "", err
			}
			return token, nil
		} else {
			return "", errors.New(resp.Status)
		}
	}
}

func (c *Client) GetService(name string) (*api.ServiceSpec, error) {

	url := c.BasePath + "services/" + name

	request, err := http.NewRequest("GET", url, nil)
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))

	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode == http.StatusOK {

		defer resp.Body.Close()
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		service := api.ServiceSpec{}
		json.Unmarshal([]byte(body), &service)
		return &service, nil
	} else {
		return nil, errors.New(resp.Status)
	}
	return nil, nil
}

func (c *Client) ListStacks() (*[]api.Stack, error) {

	url := c.BasePath + "/stacks"

	request, err := http.NewRequest("GET", url, nil)
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode == http.StatusOK {

		defer resp.Body.Close()
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		stacks := make([]api.Stack, 0)
		json.Unmarshal([]byte(body), &stacks)
		return &stacks, nil
	} else {
		return nil, errors.New(resp.Status)
	}
}

func (c *Client) AddStack(stack *api.Stack) (*api.Stack, error) {

	url := c.BasePath + "/stacks"

	data, err := json.Marshal(stack)
	request, err := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return nil, err
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return nil, err
			}

			stack := api.Stack{}
			json.Unmarshal([]byte(body), &stack)
			return &stack, nil

		} else {
			return nil, errors.New(resp.Status)
		}
	}
	return nil, nil
}

func (c *Client) UpdateStack(stack *api.Stack) error {

	url := c.BasePath + "/stacks/" + stack.Id

	data, err := json.Marshal(stack)
	request, err := http.NewRequest("PUT", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return err
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return err
			}

			stack := api.Stack{}
			json.Unmarshal([]byte(body), &stack)
			return nil

		} else {
			return errors.New(resp.Status)
		}
	}
}

func (c *Client) ListAccounts(token string) (*[]api.Account, error) {

	url := c.BasePath + "accounts"

	request, err := http.NewRequest("GET", url, nil)
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode == http.StatusOK {

		defer resp.Body.Close()
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		accounts := make([]api.Account, 0)
		json.Unmarshal([]byte(body), &accounts)
		return &accounts, nil

	} else {
		return nil, errors.New(resp.Status)
	}
}

func (c *Client) AddAccount(account *api.Account, token string) error {

	url := c.BasePath + "accounts/"

	data, err := json.Marshal(account)
	request, err := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return err
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return err
			}

			account := api.Account{}
			json.Unmarshal([]byte(body), &account)
			return nil

		} else {
			return errors.New(resp.Status)
		}
	}
}

func (c *Client) UpdateAccount(account *api.Account) error {

	url := c.BasePath + "accounts/" + account.Namespace

	data, err := json.Marshal(account)
	request, err := http.NewRequest("PUT", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return err
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return err
			}

			account := api.Account{}
			json.Unmarshal([]byte(body), &account)
			return nil

		} else {
			return errors.New(resp.Status)
		}
	}
}

func (c *Client) AddService(service *api.ServiceSpec, token string, catalog string) (*api.ServiceSpec, error) {

	url := c.BasePath + "services"

	if catalog != "" {
		url += "?catalog=" + catalog
	}

	data, err := json.Marshal(service)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return nil, err
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return nil, err
			}

			service := api.ServiceSpec{}
			json.Unmarshal([]byte(body), &service)
			return &service, nil
		} else {
			return nil, errors.New(resp.Status)
		}
	}
}

func (c *Client) ListVolumes() (*[]api.Volume, error) {

	url := c.BasePath + "/volumes"

	request, err := http.NewRequest("GET", url, nil)
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode == http.StatusOK {

		defer resp.Body.Close()
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		volumes := make([]api.Volume, 0)
		json.Unmarshal([]byte(body), &volumes)
		return &volumes, nil

	} else {
		return nil, errors.New(resp.Status)
	}
}

func (c *Client) UpdateVolume(volume *api.Volume) (*api.Volume, error) {

	url := c.BasePath + "/volumes/" + volume.Id

	data, err := json.Marshal(volume)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequest("PUT", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode == http.StatusOK {
		defer resp.Body.Close()
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		volume := api.Volume{}
		json.Unmarshal([]byte(body), &volume)
		return &volume, nil
	} else {
		return nil, errors.New(resp.Status)
	}
}

func (c *Client) GetVolume(id string) (*api.Volume, error) {

	url := c.BasePath + "/volumes/" + id

	request, err := http.NewRequest("GET", url, nil)
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))

	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode == http.StatusOK {

		defer resp.Body.Close()
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		volume := api.Volume{}
		json.Unmarshal([]byte(body), &volume)
		return &volume, nil
	} else {
		return nil, errors.New(resp.Status)
	}
}

func (c *Client) AddVolume(volume *api.Volume) (*api.Volume, error) {

	data, err := json.Marshal(&volume)
	if err != nil {
		return nil, err
	}

	url := c.BasePath + "/volumes"

	request, err := http.NewRequest("POST", url, bytes.NewBuffer(data))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return nil, err
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return nil, err
			}

			volume := api.Volume{}
			json.Unmarshal([]byte(body), &volume)
			return &volume, nil
		} else {
			return nil, errors.New(resp.Status)
		}
	}
}

func (c *Client) DeleteService(service string, token string, catalog string) error {

	url := c.BasePath + "services/" + service

	if catalog != "" {
		url += "?catalog=" + catalog
	}

	request, err := http.NewRequest("DELETE", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return err
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			_, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return err
			}

		} else {
			return errors.New(resp.Status)
		}
	}
	return nil
}

func (c *Client) DeleteAccount(account string, token string) error {

	url := c.BasePath + "accounts/" + account

	request, err := http.NewRequest("DELETE", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return err
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			_, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return err
			}

		} else {
			return errors.New(resp.Status)
		}
	}
	return nil
}

func (c *Client) DeleteVolume(volumeId string) error {

	url := c.BasePath + "/volumes/" + volumeId

	request, err := http.NewRequest("DELETE", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return err
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			_, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return err
			}

		} else {
			return errors.New(resp.Status)
		}
	}
	return nil
}

func (c *Client) DeleteStack(stackKey string) error {

	url := c.BasePath + "/stacks/" + stackKey

	request, err := http.NewRequest("DELETE", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return err
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			_, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return err
			}

		} else {
			return errors.New(resp.Status)
		}
	}
	return nil
}

func (c *Client) GetStack(sid string) (*api.Stack, error) {
	url := fmt.Sprintf("%s/stacks/%s", c.BasePath, sid)

	request, err := http.NewRequest("GET", url, nil)

	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode == http.StatusOK {

		defer resp.Body.Close()
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		stack := api.Stack{}
		err = json.Unmarshal([]byte(body), &stack)
		if err != nil {
			return nil, err
		}

		return &stack, nil
	} else {
		return nil, errors.New(resp.Status)
	}
}

func (c *Client) GetLogs(sid string, lines int) (string, error) {

	url := c.BasePath + "/logs/" + sid
	if lines > 0 {
		url += fmt.Sprintf("?lines=%d", lines)
	}

	request, err := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return "", err
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return "", err
			}
			var log string
			json.Unmarshal(body, &log)
			return log, nil
		} else {
			return "", errors.New(resp.Status)
		}
	}
}

func (c *Client) StartStack(stack string) (*api.Stack, error) {

	url := c.BasePath + "/start/" + stack

	request, err := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return nil, err
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return nil, err
			}

			stack := api.Stack{}
			err = json.Unmarshal([]byte(body), &stack)
			if err != nil {
				return nil, err
			}

			return &stack, nil
		} else {
			return nil, errors.New(resp.Status)
		}
	}
}

func (c *Client) StopStack(stack string) (*api.Stack, error) {
	url := c.BasePath + "/stop/" + stack

	request, err := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return nil, err
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return nil, err
			}

			stack := api.Stack{}
			err = json.Unmarshal([]byte(body), &stack)
			if err != nil {
				return nil, err
			}
			return &stack, nil

		} else {
			return nil, errors.New(resp.Status)
		}
	}
}

func (c *Client) GetAccount(accountId string) (*api.Account, error) {
	return c.getAccount(accountId, c.Token)
}

func (c *Client) GetAccountAdmin(accountId string, token string) (*api.Account, error) {
	return c.getAccount(accountId, token)
}

func (c *Client) getAccount(accountId string, token string) (*api.Account, error) {
	url := fmt.Sprintf("%saccounts/%s", c.BasePath, accountId)

	request, err := http.NewRequest("GET", url, nil)

	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode == http.StatusOK {

		defer resp.Body.Close()
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		account := api.Account{}
		err = json.Unmarshal([]byte(body), &account)
		if err != nil {
			return nil, err
		}

		return &account, nil
	} else {
		return nil, errors.New(resp.Status)
	}
}

func (c *Client) GetConfigs(sids []string) (*map[string][]api.Config, error) {

	services := strings.Join(sids, ",")
	url := c.BasePath + "configs?services=" + services

	request, err := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return nil, err
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return nil, err
			}
			configs := make(map[string][]api.Config)
			err = json.Unmarshal(body, &configs)
			if err != nil {
				return nil, err
			}
			return &configs, nil
		} else {
			return nil, errors.New(resp.Status)
		}
	}
}

func (c *Client) Version() (string, error) {

	url := c.BasePath + "version"

	request, err := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return "", err
	} else {
		if resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			body, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return "", err
			}
			var version string
			err = json.Unmarshal(body, &version)
			if err != nil {
				return "", err
			}
			return version, nil
		} else {
			return "", errors.New(resp.Status)
		}
	}
}

func (c *Client) Console(ssid string) error {

	var wsServer string
	if c.BasePath[:5] == "https" {
		wsServer = strings.Replace(c.BasePath, "https", "wss", 1)
	} else {
		wsServer = strings.Replace(c.BasePath, "http", "ws", 1)
	}

	wsUrl := wsServer + "console?ssid=" + ssid
	config := websocket.Config{}
	config.Version = 13
	config.Location, _ = url.Parse(wsUrl)
	config.Header = http.Header{}
	config.Origin, _ = url.Parse(c.BasePath)
	config.Header.Add("Authorization", fmt.Sprintf("Bearer %s", c.Token))

	ws, err := websocket.DialConfig(&config)
	if err != nil {
		fmt.Printf("%s\n", ws)
		return err
	}

	var stdin io.Reader

	stdin = os.Stdin

	if file, ok := stdin.(*os.File); ok {
		inFd := file.Fd()
		if term.IsTerminal(inFd) {
			oldState, err := term.SetRawTerminal(inFd)
			if err != nil {
				return err
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
	return nil
}

func (c *Client) CheckConsole(ssid string) error {

	url := c.BasePath + "check_console?ssid=" + ssid

	request, err := http.NewRequest("GET", url, nil)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))
	resp, err := c.HttpClient.Do(request)
	if err != nil {
		return err
	} else {
		if resp.StatusCode == http.StatusOK {
			return nil
		} else {
			return errors.New(resp.Status)
		}
	}
}
