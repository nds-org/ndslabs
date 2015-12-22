import os
import etcd
from supervisor.xmlrpc import SupervisorTransport
from datetime import datetime
import xmlrpclib


host_ip = os.environ.get('COREOS_PRIVATE_IPV4', None)
if host_ip is None:
    raise RuntimeError("COREOS_PRIVATE_IPV4 must be defined")

etcdc = etcd.Client(host=host_ip, port=4001)
p = xmlrpclib.ServerProxy(
    'http://127.0.0.1',
    transport=SupervisorTransport(None, None,
                                  'unix:///tmp/supervisor.sock')
)

while True:
    proxy_key = etcdc.watch("/rabbitmq/service")
    for jobname in ["yt_worker", "yt_cron"]:
        if not p.supervisor.stopProcess(jobname):
            print("[%s] %s failed to stop\n" % (datetime.now(), jobname))
    if proxy_key is not None:
        for jobname in ["yt_worker", "yt_cron"]:
            if not p.supervisor.startProcess(jobname):
                print("[%s] %s failed to start\n" % (datetime.now(), jobname))
