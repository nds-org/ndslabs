package client

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	api "github.com/nds-labs/apiserver/types"
	"io/ioutil"
	"net/http"
	"strings"
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
				return "", nil
			}

			return token, nil
		} else {
			return "", errors.New(resp.Status)
		}
	}
}

func (c *Client) ListServices() (*[]api.ServiceSpec, error) {

	url := c.BasePath + "services"
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

func (c *Client) ListStacks(pid string) (*[]api.Stack, error) {

	url := c.BasePath + "projects/" + pid + "/stacks"

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

func (c *Client) AddStack(project string, stack *api.Stack) error {

	url := c.BasePath + "projects/" + project + "/stacks"

	data, err := json.Marshal(stack)
	request, err := http.NewRequest("POST", url, bytes.NewBuffer(data))
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

func (c *Client) UpdateStack(project string, stack *api.Stack) error {

	url := c.BasePath + "projects/" + project + "/stacks/" + stack.Id

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

func (c *Client) ListProjects() (*[]api.Project, error) {

	url := c.BasePath + "projects"

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

		projects := make([]api.Project, 0)
		json.Unmarshal([]byte(body), &projects)
		return &projects, nil

	} else {
		return nil, errors.New(resp.Status)
	}
}

func (c *Client) AddProject(project *api.Project) error {

	url := c.BasePath + "projects/"

	data, err := json.Marshal(project)
	request, err := http.NewRequest("POST", url, bytes.NewBuffer(data))
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

			project := api.Project{}
			json.Unmarshal([]byte(body), &project)
			return nil

		} else {
			return errors.New(resp.Status)
		}
	}
}

func (c *Client) AddService(service *api.ServiceSpec) (*api.ServiceSpec, error) {

	url := c.BasePath + "services"

	data, err := json.Marshal(service)
	if err != nil {
		return nil, err
	}

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

			service := api.ServiceSpec{}
			json.Unmarshal([]byte(body), &service)
			return &service, nil
		} else {
			return nil, errors.New(resp.Status)
		}
	}
}

func (c *Client) ListVolumes(pid string) (*[]api.Volume, error) {

	url := c.BasePath + "projects/" + pid + "/volumes"

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

func (c *Client) UpdateVolume(pid string, volume *api.Volume) (*api.Volume, error) {

	url := c.BasePath + "projects/" + pid + "/volumes/" + volume.Name

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

func (c *Client) GetVolume(pid string, name string) (*api.Volume, error) {

	url := c.BasePath + "projects/" + pid + "/volumes/" + name

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

func (c *Client) AddVolume(pid string, volume *api.Volume) (*api.Volume, error) {

	data, err := json.Marshal(&volume)
	if err != nil {
		return nil, err
	}

	url := c.BasePath + "projects/" + pid + "/volumes"

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

func (c *Client) DeleteService(service string) error {

	url := c.BasePath + "services/" + service

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

func (c *Client) DeleteProject(project string) error {

	url := c.BasePath + "projects/" + project

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

func (c *Client) DeleteVolume(project string, volumeId string) error {

	url := c.BasePath + "projects/" + project + "/volumes/" + volumeId

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

func (c *Client) DeleteStack(project string, stackKey string) error {

	url := c.BasePath + "projects/" + project + "/stacks/" + stackKey

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

func (c *Client) GetStack(pid string, sid string) (*api.Stack, error) {
	url := fmt.Sprintf("%sprojects/%s/stacks/%s", c.BasePath, pid, sid)

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

func (c *Client) GetLogs(pid string, sid string, lines int) (string, error) {

	url := c.BasePath + "projects/" + pid + "/logs/" + sid
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

func (c *Client) StartStack(pid string, stack string) (*api.Stack, error) {

	url := c.BasePath + "projects/" + pid + "/start/" + stack

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

func (c *Client) StopStack(pid string, stack string) (*api.Stack, error) {
	url := c.BasePath + "projects/" + pid + "/stop/" + stack

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

func (c *Client) GetProject(pid string) (*api.Project, error) {
	url := fmt.Sprintf("%sprojects/%s", c.BasePath, pid)

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

		project := api.Project{}
		err = json.Unmarshal([]byte(body), &project)
		if err != nil {
			return nil, err
		}

		return &project, nil
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
