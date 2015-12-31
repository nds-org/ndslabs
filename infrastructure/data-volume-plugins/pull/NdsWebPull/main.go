package main

import (
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
    "log"
    "github.com/docker/go-plugins-helpers/volume"
)

const (
	pluginId = "NdsPull"
)

var (
	socketAddress = filepath.Join("/run/docker/plugins/", strings.Join([]string{pluginId, ".sock"}, ""))
	defaultDir    = filepath.Join(volume.DefaultDockerRootDirectory, strings.Join([]string{"_", pluginId}, ""))
)

type NdsWebDriver struct {
}

func (g NdsWebDriver) Create(r volume.Request) volume.Response {
	log.Printf("Create %v\n", r)
	return volume.Response{}
}

func (g NdsWebDriver) Remove(r volume.Request) volume.Response {
	log.Printf("Remove %v\n", r)
	return volume.Response{}
}

func (g NdsWebDriver) Path(r volume.Request) volume.Response {
	log.Printf("Path %v\n", r)
	return volume.Response{Mountpoint: r.Name}
}

func (g NdsWebDriver) Mount(r volume.Request) volume.Response {
	p := r.Name

	v := strings.Split(r.Name, "/")
	v[0] = v[0] + ":"
	source := strings.Join(v, "/")

	log.Printf("Mount %s at %s\n", source, p)

	if err := os.MkdirAll(p, 0755); err != nil {
		return volume.Response{Err: err.Error()}
	}

	// if err := ioutil.WriteFile(filepath.Join(p, "test"), []byte("TESTTEST"), 0644); err != nil {
	// log.Printf("wrote %s\n", filepath.Join(p, "test"))
	// if err := run("mount", "--bind", "/data/ISOs", p); err != nil {
	if err := run("mount", "-o", "port=2049,nolock,proto=tcp", source, p); err != nil {
		return volume.Response{Err: err.Error()}
	}

	return volume.Response{Mountpoint: p}
}

func (g NdsWebDriver) Unmount(r volume.Request) volume.Response {
	p := r.Name
	log.Printf("Unmount %s\n", p)

	if err := run("umount", p); err != nil {
		return volume.Response{Err: err.Error()}
	}

	err := os.RemoveAll(p)
	return volume.Response{Err: err.Error()}
}

func main() {
	d := NdsWebDriver{}
	h := volume.NewHandler(d)
	log.Printf("listening on %s\n", socketAddress)
	fmt.Println(h.ServeUnix("root", socketAddress))
}

var (
	verbose = true
)

func run(exe string, args ...string) error {
	cmd := exec.Command(exe, args...)
	if verbose {
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		log.Printf("executing: %v %v", exe, strings.Join(args, " "))
	}
	if err := cmd.Run(); err != nil {
		return err
	}
	return nil
}
