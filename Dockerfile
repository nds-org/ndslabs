FROM ubuntu:14.04
MAINTAINER willis8@illinois.edu

RUN apt-get update -y && apt-get install -y curl git

RUN git clone https://github.com/nds-org/ndslabs-specs /specs

COPY build/bin/apiserver /
COPY entrypoint.sh /

VOLUME /volumes

ENTRYPOINT ["/entrypoint.sh"]
CMD ["apiserver"]
