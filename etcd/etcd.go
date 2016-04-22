// Copyright © 2016 National Data Service
package etcd

import (
	"encoding/json"
	"time"

	api "github.com/ndslabs/apiserver/types"
	"golang.org/x/net/context"

	"github.com/coreos/etcd/client"
	"github.com/golang/glog"
)

var etcdBasePath = "/ndslabs/"

type EtcdHelper struct {
	etcd client.KeysAPI
}

func NewEtcdHelper(address string) (*EtcdHelper, error) {

	etcd, err := GetEtcdClient(address)

	return &EtcdHelper{
		etcd: etcd,
	}, err
}

func (s *EtcdHelper) GetProject(pid string) (*api.Project, error) {
	path := etcdBasePath + "/projects/" + pid + "/project"

	glog.Infof("GetProject %s\n", path)

	resp, err := s.etcd.Get(context.Background(), path, nil)

	if err != nil {
		return nil, err
	} else {
		project := api.Project{}
		json.Unmarshal([]byte(resp.Node.Value), &project)
		return &project, nil
	}
}

func (s *EtcdHelper) PutProject(pid string, project *api.Project) error {

	data, _ := json.Marshal(project)
	opts := client.SetOptions{Dir: true}
	s.etcd.Set(context.Background(), etcdBasePath+"/projects/"+pid, "", &opts)
	_, err := s.etcd.Set(context.Background(), etcdBasePath+"/projects/"+pid+"/project", string(data), nil)
	if err != nil {
		glog.Error(err)
		return err
	}

	return nil
}

func (s *EtcdHelper) GetServices() (*[]api.ServiceSpec, error) {

	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/services", nil)
	if err != nil {
		return nil, err
	} else {
		services := []api.ServiceSpec{}
		nodes := resp.Node.Nodes
		for _, node := range nodes {
			service := api.ServiceSpec{}
			json.Unmarshal([]byte(node.Value), &service)
			services = append(services, service)
		}
		return &services, nil
	}
}

func (s *EtcdHelper) PutService(key string, service *api.ServiceSpec) error {
	data, err := json.Marshal(service)
	if err != nil {
		glog.Error(err)
		return err
	}
	_, err = s.etcd.Set(context.Background(), etcdBasePath+"/services/"+key, string(data), nil)
	if err != nil {
		glog.Error(err)
		return err
	}
	return nil
}

func GetEtcdClient(etcdAddress string) (client.KeysAPI, error) {
	glog.V(3).Infof("GetEtcdClient %s\n", etcdAddress)

	cfg := client.Config{
		Endpoints:               []string{"http://" + etcdAddress},
		Transport:               client.DefaultTransport,
		HeaderTimeoutPerRequest: time.Second,
	}

	c, err := client.New(cfg)
	if err != nil {
		glog.Error(err)
		return nil, err
	}
	kapi := client.NewKeysAPI(c)

	resp, err := kapi.Get(context.Background(), "/", nil)
	_ = resp
	if err != nil {
		glog.Error(err)
		return nil, err
	}

	return kapi, nil
}

func (s *EtcdHelper) GetServiceSpec(key string) (*api.ServiceSpec, error) {

	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/services/"+key, nil)
	if err != nil {
		glog.Error(err)
		return nil, err
	} else {
		service := api.ServiceSpec{}
		node := resp.Node
		json.Unmarshal([]byte(node.Value), &service)
		return &service, nil
	}
}

func (s *EtcdHelper) GetProjects() (*[]api.Project, error) {

	projects := []api.Project{}

	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/projects", nil)

	if err == nil {
		nodes := resp.Node.Nodes
		for _, node := range nodes {

			resp, err = s.etcd.Get(context.Background(), node.Key+"/project", nil)
			if err != nil {
				return nil, err
			}
			project := api.Project{}
			err := json.Unmarshal([]byte(resp.Node.Value), &project)
			if err != nil {
				return nil, err
			}
			projects = append(projects, project)
		}
	}
	return &projects, nil
}

func (s *EtcdHelper) GetStack(pid string, sid string) (*api.Stack, error) {

	path := "/projects/" + pid + "/stacks/" + sid
	resp, err := s.etcd.Get(context.Background(), etcdBasePath+path, nil)

	if err != nil {
		return nil, err
	} else {
		stack := api.Stack{}
		json.Unmarshal([]byte(resp.Node.Value), &stack)
		return &stack, nil
	}
}

func (s *EtcdHelper) PutStack(pid string, sid string, stack *api.Stack) error {
	opts := client.SetOptions{Dir: true}
	s.etcd.Set(context.Background(), etcdBasePath+"/projects/"+pid, "/stacks", &opts)

	data, _ := json.Marshal(stack)
	path := etcdBasePath + "/projects/" + pid + "/stacks/" + sid
	//glog.V(4).Infof("stack %s\n", data)
	_, err := s.etcd.Set(context.Background(), path, string(data), nil)
	if err != nil {
		glog.Error("Error storing stack %s", err)
		return err
	} else {
		return nil
	}
}

func (s *EtcdHelper) GetVolumes(pid string) (*[]api.Volume, error) {

	volumes := make([]api.Volume, 0)

	volumePath := etcdBasePath + "/projects/" + pid + "/volumes"
	resp, err := s.etcd.Get(context.Background(), volumePath, nil)
	if err != nil {
		if client.IsKeyNotFound(err) {
			glog.V(4).Infof("Creating volumes key for %s\n", pid)
			opts := client.SetOptions{Dir: true}
			_, err = s.etcd.Set(context.Background(), volumePath, "", &opts)
			if err != nil {
				glog.V(4).Infof("Error creating volumes key for %s: %s\n", pid, err)
			}
			return &volumes, nil
		} else {
			glog.V(4).Infof("Error creating volumes key for %s\n", pid)
			return &volumes, err
		}
	} else {
		nodes := resp.Node.Nodes
		for _, node := range nodes {
			volume := api.Volume{}
			json.Unmarshal([]byte(node.Value), &volume)

			volumes = append(volumes, volume)
		}
	}

	return &volumes, nil
}

func (s *EtcdHelper) PutVolume(pid string, vid string, volume api.Volume) error {
	opts := client.SetOptions{Dir: true}
	s.etcd.Set(context.Background(), etcdBasePath+"/projects/"+pid, "/volumes", &opts)

	data, _ := json.Marshal(volume)
	path := etcdBasePath + "/projects/" + pid + "/volumes/" + vid
	_, err := s.etcd.Set(context.Background(), path, string(data), nil)
	if err != nil {
		return err
	} else {
		return nil
	}
}

func (s *EtcdHelper) GetVolume(pid string, vid string) (*api.Volume, error) {
	path := etcdBasePath + "/projects/" + pid + "/volumes/" + vid
	resp, err := s.etcd.Get(context.Background(), path, nil)

	if err != nil {
		return nil, err
	} else {
		volume := api.Volume{}
		json.Unmarshal([]byte(resp.Node.Value), &volume)
		return &volume, nil
	}
}

func (s *EtcdHelper) DeleteProject(pid string) error {
	_, err := s.etcd.Delete(context.Background(), etcdBasePath+"/projects/"+pid, &client.DeleteOptions{Recursive: true})
	if err != nil {
		return err
	}
	return nil
}

func (s *EtcdHelper) DeleteService(key string) error {
	_, err := s.etcd.Delete(context.Background(), etcdBasePath+"/services/"+key, nil)
	if err != nil {
		return err
	}
	return nil
}

func (s *EtcdHelper) DeleteStack(pid string, sid string) error {
	path := etcdBasePath + "/projects/" + pid + "/stacks/" + sid
	_, err := s.etcd.Delete(context.Background(), path, nil)
	if err != nil {
		return err
	}
	return nil
}

func (s *EtcdHelper) DeleteVolume(pid string, vid string) error {
	path := etcdBasePath + "/projects/" + pid + "/volumes/" + vid
	_, err := s.etcd.Delete(context.Background(), path, nil)
	if err != nil {
		return err
	}
	return nil
}

func (s *EtcdHelper) GetStacks(pid string) (*[]api.Stack, error) {

	stacks := []api.Stack{}

	resp, err := s.etcd.Get(context.Background(), etcdBasePath+"/projects/"+pid+"/stacks", nil)

	if err == nil {
		nodes := resp.Node.Nodes
		for _, node := range nodes {
			stack := api.Stack{}
			err := json.Unmarshal([]byte(node.Value), &stack)
			if err != nil {
				return nil, err
			}
			stacks = append(stacks, stack)
		}
	}
	return &stacks, nil
}
