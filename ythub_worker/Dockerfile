FROM debian:sid
MAINTAINER Kacper Kowalik "xarthius.kk@gmail.com"

ENV DEBIAN_FRONTEND noninteractive
ENV IRODS_DATADIR /tempZone/home/rods/data

RUN apt-get update -qq && \
    apt-get install -qy curl sudo python-dev python-pip git-core docker.io fuse libfuse-dev libssl-dev && \
    apt-get upgrade -y && \
    apt-get clean

RUN pip install supervisor python-etcd

# add a user
RUN useradd -D --shell=/bin/bash && \
    useradd -m user && \
    echo "user:secret" | chpasswd && \
    adduser user sudo && \
    gpasswd -a user docker && \
    sudo -u user mkdir /home/user/yt_serve && \
    echo "user_allow_other" >> /etc/fuse.conf

ADD ./root.tar.xz /
ADD ./irods-fuse.sh /tmp/
# install irods client
RUN bash /tmp/irods-fuse.sh
RUN curl -O https://bitbucket.org/nds-org/yt_webapp/raw/master/rest2/requirements.txt && \ 
    pip install -r requirements.txt && rm -rf requirements.txt

VOLUME ["/tmp"]
CMD supervisord -n -c /etc/supervisord.conf
