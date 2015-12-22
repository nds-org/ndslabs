FROM ndslabs/hublaunch

USER root
RUN pip uninstall -y yt 
RUN apt-get update && \
    apt-get upgrade -qy && \
    apt-get purge -y ipython python-tornado && \
    apt-get autoremove -y && \
    apt-get install -y julia

# This is to get a systemwide install that's not "editable"
RUN cd /tmp/ && \
    git clone --recursive https://github.com/ipython/ipython.git && \
    cd ipython && \
    pip install -e ".[notebook]" && \
    pip uninstall ipython && \
    python2.7 setup.py install && \
    pip install terminado

USER user 
RUN cd /home/user && \
  hg clone http://bitbucket.org/yt_analysis/yt && \
  cd yt && \
  python2.7 setup.py develop --user

RUN julia -e 'Pkg.add("IJulia")'
RUN julia -e 'Pkg.add("YT")'

# These assets are from Jupyter's demo dockerfile
# https://github.com/jupyter/docker-demo-images/
RUN mkdir -p /home/user/ipython-conf/kernels/julia/
ADD ./julia/kernel.json /home/user/ipython-conf/kernels/julia/
ADD ./julia/logo-64x64.png /home/user/ipython-conf/kernels/julia/
RUN mkdir -p /home/user/.yt
ADD ./ytconfig /home/user/.yt/config
