FROM debian:sid
MAINTAINER Kacper Kowalik "xarthius.kk@gmail.com"

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update -qq && \
    apt-get install -qy build-essential gcc g++ cmake curl libreadline-dev git libqt4-core \
    			libqt4-gui libjpeg-dev libpng-dev ncurses-dev graphicsmagick \
			libzmq3-dev unzip gnuplot-x11 libsdl2-dev qt4-qmake libqt4-dev \
			libgraphicsmagick1-dev nodejs npm libfftw3-dev sox \
			libsox-dev libsox-fmt-all libopenblas-dev nodejs-legacy && \
    apt-get upgrade -y && \
    apt-get clean

# add a user
RUN useradd -D --shell=/bin/bash && \
    useradd -m user && \
    echo "user:secret" | chpasswd

ADD ./build_lua.sh /tmp/build_lua.sh
RUN bash /tmp/build_lua.sh
