FROM rocker/rstudio
 
ENV DEBIAN_FRONTEND noninteractive
ENV IRODS_DATADIR /tempZone/home/rods/data

RUN apt-get update -qq && \
    DEBIAN_FRONTEND=noninteractive apt-get install -qyy \
    	fuse libfuse-dev git-core ca-certificates libssl-dev \
	apache2 libapache2-mod-proxy-html libxml2-dev && \ 
    apt-get clean

# install irods client
ADD irods-fuse.sh /tmp/irods-fuse.sh
RUN bash /tmp/irods-fuse.sh && echo "user_allow_other" >> /etc/fuse.conf

ADD ./setup_irods.py /usr/local/bin/setup_irodsuser
ADD 000-default.conf /etc/apache2/sites-enabled/000-default.conf
RUN chmod +x /usr/local/bin/setup_irodsuser
ADD apache.conf /etc/supervisor/conf.d/apache.conf

RUN a2enmod proxy && a2enmod proxy_http

RUN mkdir /mnt/data
RUN mkdir /results
COPY userconf.sh /usr/bin/userconf.sh
