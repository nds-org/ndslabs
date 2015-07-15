FROM ubuntu:14.04

RUN apt-get update && \
        apt-get -y install nodejs npm && \
        npm install node-etcd hipache -g
RUN mkdir /hipache
ADD . /hipache
RUN cd /hipache
ENV NODE_ENV production
EXPOSE 80


CMD /hipache/run.sh
