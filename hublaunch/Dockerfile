FROM debian:sid
 
ENV DEBIAN_FRONTEND noninteractive
ENV IRODS_DATADIR /tempZone/home/rods/data

RUN apt-get update -qq && \
    DEBIAN_FRONTEND=noninteractive apt-get install -qyy \
      curl sudo python-dev python-pip git-core fuse libfuse-dev libssl-dev \
      build-essential liblapack-dev libatlas-dev gfortran libfreetype6 \
      libfreetype6-dev libpng12-dev python-lxml libyaml-dev g++ libffi-dev pkg-config \
      python-setuptools ipython-notebook python-scipy python-matplotlib \ 
      python-h5py cython python-hglib python-requests && \
    apt-get clean

# add a user
RUN useradd -D --shell=/bin/bash && \
    useradd -m user && \
    echo "user:secret" | chpasswd && \
    adduser user sudo && \
    echo "user_allow_other" >> /etc/fuse.conf

RUN pip install sympy
RUN pip install --allow-external pattern

# install irods client
ADD irods-fuse.sh /tmp/irods-fuse.sh
RUN bash /tmp/irods-fuse.sh

# Install yt
RUN cd /tmp && \
    hg clone -r stable http://bitbucket.org/yt_analysis/yt && \
    pushd yt &> /dev/null && \
    python2.7 setup.py install && \
    popd &> /dev/null \
    rm -rf yt

# ThingKing
RUN pip install thingking darksky_catalog

ADD ./setup_irods.py /usr/local/bin/setup_irodsuser
RUN chmod +x /usr/local/bin/setup_irodsuser

# IPython
ADD ./ipython-conf.tgz /home/user/
RUN chown -R user /home/user/
ENV IPYTHONDIR /home/user/ipython-conf

# Set default backend to Agg
RUN sed -i -e '/^backend/ s/TkAgg/Agg/g' /etc/matplotlibrc

# Install MathJax
RUN python2.7 -c "from IPython.external import mathjax; mathjax.install_mathjax()"

RUN pip install astropy scikit-learn

RUN mkdir /mnt/data && chown user:root /mnt/data
RUN mkdir /results && chown user:root /results
RUN mkdir -p /home/user/work && chown user:root /home/user/work

RUN apt-get install -y davfs2
RUN usermod -aG davfs2 user
RUN chmod +s /sbin/mount.davfs
RUN echo "http://labs.nationaldataservice.org/owncloud/remote.php/webdav /home/user/work davfs user,rw,noauto 0 0" \
    >> /etc/fstab

USER user
