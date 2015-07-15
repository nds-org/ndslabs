FROM ubuntu:14.04
MAINTAINER matthewturk@gmail.com
VOLUME ["/var/lib/irods/Vault", "/mnt/data"]
ENV irodshost icat1
ENV irodszone tempZone
ENV irodsresc defaultResc
ENV localzonesid TEMP_LOCAL_ZONE_SID
ENV keyforagent temp_32_byte_key_for_agent__conn
ENV dbhost db1
ENV irodspassword testpassword
ENV ytfidopassword 3nthr0py


RUN apt-get update
RUN apt-get upgrade -y

RUN locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US.UTF-8
ENV LC_ALL en_US.UTF-8

RUN DEBIAN_FRONTEND=noninteractive apt-get install -y openssh-server \
                                        supervisor wget dpkg sudo \
                                        libcurl4-gnutls-dev \
                                        openjdk-6-jdk tomcat6 nginx \
                                        maven git

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
WORKDIR /home/admin

RUN mkdir /etc/idrop-web
RUN wget -P /etc/idrop-web \
 http://people.renci.org/~danb/FOR_DEMOS/iDrop-Web-2/idrop-web-config2.groovy
RUN wget -P /var/lib/tomcat6/webapps \
 http://people.renci.org/~danb/FOR_DEMOS/iDrop-Web-2/idrop-web2.war

ADD ./tcstart.sh /home/admin/tcstart.sh
RUN echo "AUTHBIND=yes" >> /etc/default/tomcat6
CMD /usr/bin/supervisord "-n"
