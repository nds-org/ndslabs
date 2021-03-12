# Create build time container
FROM golang:1.15-buster as gobuild

# TODO: Is this needed?
#ENV GOROOT=/usr/local/go \
#    GOPATH=$HOME/go \
#    PATH=$GOPATH/bin:$GOROOT/bin:$PATH

# Install build dependencies
RUN apt-get -qq update && \
    apt-get -qq install --no-install-recommends build-essential git && \
    go get github.com/Masterminds/glide && \
    go get github.com/docker/spdystream

# Install Glide dependencies
WORKDIR /go/src/github.com/ndslabs/apiserver
COPY glide.* ./
RUN glide install --strip-vendor

# Build golang code
COPY . ./
RUN ./build.sh docker

# Create runtime container
FROM debian:buster

# Install runtime dependencies
RUN apt-get -qq update && \
    apt-get -qq install --no-install-recommends binutils git ca-certificates netcat && \
    apt-get -qq autoremove && \
    apt-get -qq autoclean && \
    apt-get -qq clean all && \
    rm -rf /var/cache/apk/* /tmp/* /var/lib/apt/lists/*

# Copy final binaries from build container
COPY --from=gobuild /go/src/github.com/ndslabs/apiserver/build/bin/ndslabsctl-*-amd64 /ndslabsctl/
COPY --from=gobuild /go/src/github.com/ndslabs/apiserver/build/bin/ndslabsctl-linux-amd64 /usr/local/bin/ndslabsctl
COPY --from=gobuild /go/src/github.com/ndslabs/apiserver/build/bin/apiserver-linux-amd64 /usr/local/bin/apiserver

COPY entrypoint.sh /entrypoint.sh
COPY templates /templates

ENTRYPOINT ["/entrypoint.sh"]
CMD ["apiserver"]
