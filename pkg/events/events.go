package events

import (
	"k8s.io/api/core/v1"
)

type EventHandler interface {
	HandlePodEvent(eventType string, pod *v1.Pod)
	HandleReplicationControllerEvent(eventType string, event *v1.Event, rc *v1.ReplicationController)
}
