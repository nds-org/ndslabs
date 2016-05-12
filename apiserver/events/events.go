package events

import (
	"k8s.io/kubernetes/pkg/api"
)

type EventHandler interface {
	HandleEvent(event api.Event, pod api.Pod)
}
