// Copyright © 2016 National Data Service
package kube

import (
	"fmt"
	"os/exec"

	"github.com/golang/glog"
	"github.com/kr/pty"
	"golang.org/x/net/websocket"
)

func NewExecHandler(pid string, ssid string, kube *KubeHelper) *websocket.Handler {
	wsHandler := websocket.Handler(func(ws *websocket.Conn) {

		pods, _ := kube.GetPods(pid, "name", ssid)
		pod := pods[0].Name
		fmt.Printf("exec called for %s %s %s\n", pid, ssid, pod)
		cmd, err := pty.Start(exec.Command("kubectl", "exec", "--namespace", pid,
			"-it", pod, "bash"))
		if err != nil {
			glog.Fatal(err)
		}

		defer ws.Close()
		defer cmd.Close()
		go func() {
			for {
				in := make([]byte, 1024)
				_, err := ws.Read(in)
				if err != nil {
					glog.Error(err)
					return
				}
				inLen, err := cmd.Write(in)
				if err != nil {
					glog.Error(err)
					return
				}
				if inLen < len(in) {
					panic("pty write overflow")
				}
			}
		}()
		out := make([]byte, 1024)
		for {
			outLen, err := cmd.Read(out)
			if err != nil {
				glog.Error(err)
				return
			}
			_, err = ws.Write(out[:outLen])
			if err != nil {
				glog.Error(err)
				return
			}
		}
	})
	return &wsHandler
}
