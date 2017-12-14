package events

import (
	"k8s.io/client-go/pkg/api/v1"
	"k8s.io/kubernetes/pkg/api"
	//	"k8s.io/kubernetes/pkg/watch"
)

type EventHandler interface {
	HandlePodEvent(eventType string, pod *v1.Pod)
	HandleReplicationControllerEvent(eventType string, event *api.Event, rc *api.ReplicationController)
}
