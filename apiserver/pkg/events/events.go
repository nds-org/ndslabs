package events

import (
	"k8s.io/kubernetes/pkg/api"
	"k8s.io/kubernetes/pkg/watch"
)

type EventHandler interface {
	HandlePodEvent(eventType watch.EventType, event *api.Event, pod *api.Pod)
	HandleReplicationControllerEvent(eventType watch.EventType, event *api.Event, rc *api.ReplicationController)
}
