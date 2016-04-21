
# NDS Labs API Server

## Latest release
The latest release has been pushed to Dockerhub ndslabs/apiserver:latest. You can run the server via Docker:

```
docker pull ndslabs/apiserver:latest
```

## Running

Prerequisites:
* Etcd
* Kubernetes

```
docker run -e ETCD_ADDR=localhost:4001 -e KUBERNETES_ADDR=http://localhost:8080 -e CORS_ORIGIN_ADDR="http://localhost" -e HOST_ADDR=PUBLIC_IP_ADDR -e SPEC_GIT_REPO=https://github.com/nds-org/ndslabs-specs -e SPEC_GIT_BRANCH=master
```

Configuration options:
* ETCD_ADDR: address of Etcd (defaults to localhost:4001)
* KUBERNETES_ADDR: URL for Kubernetes API (Defaults to http://localhost:8080)
* CORS_ORIGIN_ADDR: URL of GUI (defaults to http://localhost)
* HOST_ADDR: Public IP address of host
* SPEC_GIT_REPO: URL to spec repo (defaults to https://github.com/nds-org/ndslabs-specs)
* SPEC_GIT_BRANCH: Git repository branch (defaults to master)

## Building 

Prerequisites:
* For now, running on OS X with Docker Toolbox
* Go 1.5

To simply compile the go code:
```
go build
```

To build the apiserver binary for multiple architectures (output in build/bin/)
```
./build.sh
```

To tag and push images to dockerhub:
```
./build.sh <dev, test, release>
```

### Configuration

The apiserver.conf is the primary configuration file. If running the apiserver outside of Docker, you will need to manually configure the following settings:

```
[Server]
Port=30001
Origin=http://<CORS origin host>
VolDir=/home/core/apiserver/volumes
Host=<your host ip>
VolumeSource=local
SpecsDir=<optional path to local specs directory>

[Etcd]
Address=localhost:4001

[Kubernetes]
Address=localhost:8080

```

If VolumeSource is "local", a local directory is used for hostPath volumes in Kubernetes. 


### Running the server

The server requires etcd and Kubernetes. You can either run a separate etcd or use the Kubernetes instance.

To run
```
./apiserver -v <log verbosity 1-4> --conf <path to apiserver.conf> --passwd <admin password>
```
