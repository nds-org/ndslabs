FROM ubuntu:xenial
MAINTAINER willis8@illinois.edu


COPY . /go/src/github.com/ndslabs/apiserver

RUN apt-get update -y -qq && \
	apt-get install -y -qq binutils curl gcc git vim && \
    mkdir /golang && cd /golang && \
	curl -s -O https://storage.googleapis.com/golang/go1.6.linux-amd64.tar.gz && \
	tar -xvf go1.6.linux-amd64.tar.gz && \
    export GOROOT=/golang/go && \
    export GOPATH=/go/ && \
    export PATH=$PATH:$GOROOT/bin:$GOPATH/bin  && \
    cd /go/src/github.com/ndslabs/apiserver && \
    go get github.com/Masterminds/glide && \
    ./build.sh docker && \
    mv build/bin/apiserver-linux-amd64 /apiserver && \
    mkdir /ndslabsctl/ && mv build/bin/ndslabsctl* /ndslabsctl && \
    rm -rf /golang && \
    rm -rf /go && \
    apt-get remove --purge gcc -y -qq && \
    apt-get autoremove -y -qq
    

COPY entrypoint.sh /
COPY templates /templates

VOLUME /volumes

ENTRYPOINT ["/entrypoint.sh"]
CMD ["apiserver"]
