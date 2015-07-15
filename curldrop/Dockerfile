FROM ubuntu:trusty
MAINTAINER xarthisius.kk@gmail.com
RUN locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US.UTF-8
ENV LC_ALL en_US.UTF-8
ENV PYTHONPATH /usr/local/lib/python2.7/dist-packages
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y wget sudo unzip \
        krb5-locales libasn1-8-heimdal libcurl3-gnutls libgssapi-krb5-2 \
        libgssapi3-heimdal libhcrypto4-heimdal libheimbase1-heimdal \
	libheimntlm0-heimdal libhx509-5-heimdal libk5crypto3 libkeyutils1 \
	libkrb5-26-heimdal libkrb5-3 libkrb5support0 libldap-2.4-2 libmysqlclient18 \
	libpython-stdlib libpython2.7-minimal libpython2.7-stdlib libroken18-heimdal \
	librtmp0 libsasl2-2 libsasl2-modules libsasl2-modules-db libwind0-heimdal \
	mysql-common python python-minimal python-mysqldb python-pycurl \
	python2.7 python2.7-minimal python-werkzeug && \ 
    apt-get clean

RUN cd /tmp && wget https://github.com/nephics/tornado/archive/streambody.zip && \
    unzip streambody.zip && cd tornado-streambody/ && \
    python setup.py install

RUN cd /tmp && wget https://github.com/Xarthisius/curldrop/archive/master.zip && \
    unzip master.zip

VOLUME ["/mnt/uploads"]
EXPOSE 8888

CMD ["python", "/tmp/curldrop-master/runcurldrop.py"]

#set up supervisor
# RUN mkdir -p /var/log/supervisor
# ADD ./common/supervisord.conf.etc /etc/supervisor/supervisord.conf
# ADD ./common/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

