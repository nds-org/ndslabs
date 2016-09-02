package main

var stackStatus = map[int]string{
	Started:  "started",
	Starting: "starting",
	Stopped:  "stopped",
	Stopping: "stopping",
}

const (
	Started  = 1
	Starting = 2
	Stopped  = 3
	Stopping = 4
)
