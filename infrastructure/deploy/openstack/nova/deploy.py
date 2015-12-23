import argparse
import time
import os
import sys
import requests
from string import Template
import novaclient.v1_1.client as nvclient
#from novaclient import client as nvclient#
import novaclient
from openstackclient.compute.v2 import keypair
#from novaclient.v1_1 import 
#from novaclient import client as novaclient

CONF = {'keyname': "NDS'', "}

def get_keystone_creds():
    d = {}
    d['username'] = os.environ['OS_USERNAME']
    d['password'] = os.environ['OS_PASSWORD']
    d['auth_url'] = os.environ['OS_AUTH_URL']
    d['tenant_name'] = os.environ['OS_TENANT_NAME']
    return d

def get_nova_creds():
    d = {}
    d['username'] = os.environ['OS_USERNAME']
    d['api_key'] = os.environ['OS_PASSWORD']
    d['auth_url'] = os.environ['OS_AUTH_URL']
    d['project_id'] = os.environ['OS_TENANT_NAME']
    return d


if __name__ == "__main__":
    print 'hello sailor'
    creds = get_nova_creds()
    nova = nvclient.Client(**creds)
    
    #
    # Set the key
    #
    try:
        keyManager = nova.keypairs
        keyManager.create(CONF['keyname'])
    except:
        print 'unable to create key'
    
    keys = keyManager.list()
    print 'Available KeyPairs: '
    for k in keys:
        kn =  k.to_dict()
        print kn['keypair']['name']
    if len(keys) == 0:
        print "None: "
        
    etcd_token = requests.get("https://discovery.etcd.io/new").text
        
    print 'goodbye'

    