
# NDS Labs API Server

This document describes how to run the Labs Workbench API server for
development.


## Install and Configure Minikube

Install and start Minikube based on the [official documentation](https://kubernetes.io/docs/tasks/tools/install-minikube/) for your operating system.

Start your minikube instance:
```
minikube start
```

Workbench relies on labeled nodes. Label the node:

```
kubectl label nodes minikube  ndslabs-role-compute=true
```

## Install and Configure Etcd

Workbench requires `etcd`. For development purposes you can install it
locally via Docker:

```
docker run --rm -p 4001:4001 -d ndslabs/etcd:2.2.5  /usr/local/bin/etcd \
         --bind-addr=0.0.0.0:4001 \
         --advertise-client-urls=http://127.0.0.1:4001 
```

## Setup your Go environment

Install Go for development (assumes Mac OS)

```
brew install go --cross-compile-common
```

Setup your paths:
```
mkdir $HOME/go
```

Edit `$HOME/.bash_profile`:
```
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
```

Source your profile:
```
. $HOME/.bash_profile
```


## Clone and build the API server

Clone this repo:
```
mkdir -p $GOPATH/src/github.com/
cd $GOPATH/src/github.com/
git clone https://github.com/nds-org/ndslabs 
cd ndslabs/apiserver
```	

Build local binaries:
```
./build.sh local
```

## Configure API server

Clone the `ndslabs-specs` repo anywhere on your machine:
```
git clone https://github.com/nds-org/ndslabs-specs
```

Modify the `apiserver.json` to reflect your local configuration. At a minimum,
set the `support.email` to your email address, `kubernetes.address` to 
`https://minikube-ip:8443` and the `specs.path` to the location of the cloned repo above.


## Run the API server

Assuming `minikube` and `etcd` are running, you can simply run the apiserver
binary:

```
./build/bin/apiserver-darwin-amd64
```

## Running integration tests

Install `newman` (may require `sudo`):
```
npm install -g newman
```

To configure the postman environment, edit `postman/workbench.postman_environment.json`
and set the `host` value to `localhost:30001` and `email` value to your email
address.

Because the API server is running insecure, you'll need to edit `postman/Workbench.postman_collection_local.json` 
and replace all instances of `https` with `http`.

Run the tests:
```
cd postman
newman run --insecure  --environment=workbench.postman_environment.json --delay-request=1000 Workbench.postman_collection_local.json
```

## Running as an external service

It is also possible to run the Workbench API server outside of the cluster. This has been tested with minikube via VirtualBox on MacOS.

Create a file `external-apiserver.yaml` with the following. Note that 10.0.2.2 is the internal address of your minikube VM. You can confirm this via `minikube ssh` and `netstat -rn`:
```
kind: "Service"
apiVersion: "v1"
metadata:
  name: "ndslabs-apiserver"
spec:
  ports:
    - protocol: "TCP"
      port: 30001
      targetPort: 30001
---
kind: "Endpoints"
apiVersion: "v1"
metadata:
  name: "ndslabs-apiserver"
subsets:
  - addresses:
    - ip: "10.0.2.2"
    ports:
    - port: 30001
```

Delete the in-cluster API server and create this external service/endpoint:
```
kubectl delete svc ndslabs-apiserver
kubectl create -f external-apiserver.yaml
```



