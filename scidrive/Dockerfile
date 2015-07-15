FROM ubuntu:14.04
MAINTAINER matthewturk@gmail.com
ENV scidrive_region localhost
ENV scidrive_dbhost mysql1
ENV scidrive_dbroot root
ENV scidrive_dbpass sillypassword
ENV scidrive_rabbitmq rabbitmq1
ENV scidrive_sso_url https://sso.usvao.org/openid/provider_id

RUN apt-get update
RUN apt-get update --fix-missing
RUN apt-get upgrade -y

RUN locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US.UTF-8
ENV LC_ALL en_US.UTF-8

RUN DEBIAN_FRONTEND=noninteractive apt-get install -y tomcat7

ADD ./setup_scidrive.sh /
WORKDIR /
CMD bash /setup_scidrive.sh
