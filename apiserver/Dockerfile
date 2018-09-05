FROM golang:1.8-jessie as gobuild
COPY . /go/src/github.com/ndslabs/apiserver

RUN apt-get -qq update && \
    apt-get -qq install bash build-essential git gcc  && \
    go get github.com/Masterminds/glide  &&  \
    cd /go/src/github.com/ndslabs/apiserver && ./build.sh docker

FROM debian:jessie
COPY --from=gobuild /go/src/github.com/ndslabs/apiserver/build/bin/ndslabsctl-linux-amd64 /ndslabsctl/ndslabsctl-linux-amd64
COPY --from=gobuild /go/src/github.com/ndslabs/apiserver/build/bin/ndslabsctl-darwin-amd64 /ndslabsctl/ndslabsctl-darwin-amd64
COPY --from=gobuild /go/src/github.com/ndslabs/apiserver/build/bin/apiserver-linux-amd64 /usr/local/bin/apiserver
COPY entrypoint.sh /entrypoint.sh
COPY templates /templates
RUN apt-get -qq update && \
    apt-get -qq install bash binutils git vim && \
    apt-get -qq autoremove && \
    apt-get -qq autoclean && \
    apt-get -qq clean all && \
    rm -rf /var/cache/apk/* /tmp/* /var/lib/apt/lists/* && \
    ln -s /ndslabsctl/ndslabsctl-linux-amd64 /usr/local/bin/ndslabsctl 

ENTRYPOINT ["/entrypoint.sh"]
CMD ["apiserver"]
