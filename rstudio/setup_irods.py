#!/usr/bin/env python2

import os
import sys
import subprocess
import urlparse
import json
from pwd import getpwnam

user = getpwnam("rstudio")
uhome = user.pw_dir
uuid = user.pw_uid
ugid = user.pw_gid
ihome = os.path.join(uhome, ".irods")
if not os.path.isdir(ihome):
    os.mkdir(ihome, 0700)

if not os.path.isfile(os.path.join(ihome, ".irodsEnv")):
    host_ip = os.environ.get('COREOS_PRIVATE_IPV4', None)
    with open(os.path.join(ihome, ".irodsEnv"), 'w') as fh:
        fh.write("irodsHost %s\n" % os.environ.get('irodsHost', ''))
        fh.write("irodsPort %s\n" % os.environ.get('irodsPort', ''))
        fh.write("irodsZone %s\n" % os.environ.get('irodsZone', ''))
        fh.write("irodsUserName ytfido\n")

if not os.path.isfile(os.path.join(ihome, ".irodsA")):
    cmd = "iinit %s" % os.environ.get('ytfidopassword', '3nthr0py')
    subprocess.call(cmd, shell=True)

# Mount iRODS resources
cwd = os.getcwd()
for directory in json.loads(os.environ.get('mounts', '[]')):
    os.chdir("/mnt/data")
    path = urlparse.urlparse(directory).path
    target = os.path.join("/mnt/data", os.path.basename(path))
    os.mkdir(target)
    cmd = 'icd ' + path + ' && ' + 'irodsFs -o allow_other ' + target
    subprocess.call(cmd, shell=True)
os.chdir(cwd)
