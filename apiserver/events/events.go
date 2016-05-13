package events

import (
	"k8s.io/kubernetes/pkg/api"
	"k8s.io/kubernetes/pkg/watch"
)

type EventHandler interface {
	HandleEvent(eventType watch.EventType, event *api.Event, pod *api.Pod)
}
