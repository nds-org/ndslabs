FROM ubuntu:14.04
MAINTAINER matthewturk@gmail.com

VOLUME ["/var/lib/irods/Vault"]

ENV irodszone tempZone
ENV localzonesid TEMP_LOCAL_ZONE_SID
ENV keyforagent temp_32_byte_key_for_agent__conn
ENV dbhost db1
ENV irodspassword testpassword
ENV ytfidopassword 3nthr0py

RUN locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US.UTF-8
ENV LC_ALL en_US.UTF-8

RUN apt-get update && apt-get upgrade -y && \
   DEBIAN_FRONTEND=noninteractive apt-get install -qyy python-dev python-pip \
   supervisor wget libffi-dev libssl-dev \
   dpkg sudo libcurl4-gnutls-dev patch && \
   apt-get clean

RUN pip install python-etcd

#set up supervisor
RUN mkdir -p /var/log/supervisor
ADD ./common/supervisord.conf.etc /etc/supervisor/supervisord.conf
ADD ./common/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# set up an admin user
RUN useradd admin
RUN echo 'admin:admin' | chpasswd
RUN mkdir /home/admin
RUN chown admin:admin /home/admin
RUN chsh -s /bin/bash admin

#install iRODS
RUN wget -P /home/admin ftp://ftp.renci.org/pub/irods/releases/4.0.3/irods-database-plugin-postgres-1.3.deb
RUN wget -P /home/admin ftp://ftp.renci.org/pub/irods/releases/4.0.3/irods-icat-4.0.3-64bit.deb
#RUN wget -P /home/admin ftp://ftp.renci.org/pub/irods/plugins/irods_microservice_plugins_curl/1.1/irods-microservice-plugins-curl-1.1.deb
RUN wget -P /home/admin ftp://ftp.renci.org/pub/irods/releases/4.0.3/irods-runtime-4.0.3-64bit.deb
RUN wget -P /home/admin ftp://ftp.renci.org/pub/irods/releases/4.0.3/irods-dev-4.0.3-64bit.deb

# install package dependencies to prevent Docker build from erring out

RUN DEBIAN_FRONTEND=noninteractive apt-get install -y `dpkg -I /home/admin/irods-icat-4.0.3-64bit.deb | sed -n 's/^ Depends: //p' | sed 's/,//g'`
RUN dpkg -i /home/admin/irods-icat-4.0.3-64bit.deb

RUN DEBIAN_FRONTEND=noninteractive apt-get install -y `dpkg -I /home/admin/irods-database-plugin-postgres-1.3.deb | sed -n 's/^ Depends: //p' | sed 's/,//g'`
RUN dpkg -i /home/admin/irods-database-plugin-postgres-1.3.deb

#RUN DEBIAN_FRONTEND=noninteractive apt-get install -y `dpkg -I /home/admin/irods-microservice-plugins-curl-1.1.deb | sed -n 's/^ Depends: //p' | sed 's/,//g'`
#RUN dpkg -i /home/admin/irods-microservice-plugins-curl-1.1.deb

RUN DEBIAN_FRONTEND=noninteractive apt-get install -y `dpkg -I /home/admin/irods-runtime-4.0.3-64bit.deb | sed -n 's/^ Depends: //p' | sed 's/,//g'`
RUN dpkg -i /home/admin/irods-runtime-4.0.3-64bit.deb

RUN DEBIAN_FRONTEND=noninteractive apt-get install -y `dpkg -I /home/admin/irods-dev-4.0.3-64bit.deb | sed -n 's/^ Depends: //p' | sed 's/,//g'`
RUN dpkg -i /home/admin/irods-dev-4.0.3-64bit.deb

ADD ./icat/server.sh /home/admin/server.sh
ADD ./icat/runAll.sh /home/admin/runAll.sh
ADD ./icat/setup-irods-docker.sh /home/admin/setup-irods-docker.sh
RUN chmod a+x /home/admin/runAll.sh

ADD ./icat/irods.patch /home/admin/irods.patch
RUN cd /var/lib/irods && patch -p1 < /home/admin/irods.patch && chmod +x /var/lib/irods/packaging/setup_irods.sh
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y git libcurl3 && \
    git clone https://github.com/irods/irods_microservice_plugins_curl/ && \
    cd irods_microservice_plugins_curl && \
    ./packaging/build.sh && \
    sudo dpkg -i build/irods-microservice-plugins-curl-1.1.deb

# irods needs to be part of admin to execute supervisorctl
EXPOSE 1247
ENTRYPOINT /home/admin/setup-irods-docker.sh
