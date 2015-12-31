# Docker volume web pull populator driver

Docker volume extension that pulls data from URL into the volume

## Usage

`make build` to build the container which contains the plugin binary.


`docker run --rm -it --volume-driver=ndswebpull -v <URL>:/no busybox ls -la`

