FROM ubuntu:wily
MAINTAINER willis8@illinois.edu

RUN apt-get update -y && apt-get install -y curl git

COPY build/bin/apiserver-linux-amd64 /apiserver
COPY entrypoint.sh /

VOLUME /volumes

ENTRYPOINT ["/entrypoint.sh"]
CMD ["apiserver"]
