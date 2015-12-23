import argparse
import time
import os
import sys
import requests
from string import Template
import novaclient
from novaclient.v1_1 import client

CLOUD_CONFIG = Template('''#cloud-config

coreos:
  update:
    reboot-strategy: off
  etcd:
    # generate a new token for each unique cluster
    # from https://discovery.etcd.io/new
    discovery: $etcd
    # multi-region and multi-cloud deployments need to use $$public_ipv4
    addr: $$private_ipv4:4001
    peer-addr: $$private_ipv4:7001
  units:
    - name: docker-tcp.socket
      command: start
      enable: yes
      content: |
        [Unit]
        Description=Docker Socket for the API

        [Socket]
        ListenStream=2375
        BindIPv6Only=both
        Service=docker.service

        [Install]
        WantedBy=sockets.target
    - name: enable-docker-tcp.service
      command: start
      content: |
        [Unit]
        Description=Enable the Docker Socket for the API

        [Service]
        Type=oneshot
        ExecStart=/usr/bin/systemctl enable docker-tcp.socket
    - name: format-ephemeral.service
      command: start
      content: |
        [Unit]
        Description=Formats the ephemeral drive
        [Service]
        Type=oneshot
        RemainAfterExit=yes
        ExecStart=/bin/sh -c "/usr/sbin/wipefs -f $$(blkid -L ephemeral0)"
        ExecStart=/bin/sh -c "/usr/sbin/mkfs.btrfs -f $$(blkid -L ephemeral0) -L ephemeral0"
    - name: var-lib-docker.mount
      command: start
      content: |
        [Unit]
        Description=Mount ephemeral to /var/lib/docker
        Requires=format-ephemeral.service
        After=format-ephemeral.service
        Before=docker.service
        [Mount]
        What=LABEL="ephemeral0"
        Where=/var/lib/docker
        Type=btrfs
    - name: format-swap.service
      command: start
      content: |
        [Unit]
        Description=Formats the swap
        [Service]
        Type=oneshot
        RemainAfterExit=yes
        ExecStart=/bin/sh -c "mkswap -f $$(blkid -t TYPE=swap -o device) -L swap"
    - name: etcd.service
      command: start
    - name: fleet.service
      command: start
  fleet:
     metadata: $ip_info
ssh_authorized_keys:
  # include one or more SSH public keys
  - $sshkey
write_files:
  - path: /etc/hubenv
    permissions: 0644
    owner: root
    content: |
$envfile''')

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Spawn our coreOS.")
    parser.add_argument('--ssh-key', action='store', dest='ssh_key',
                        default="/home/mturk/core.pub")
    parser.add_argument('--ssh-key-name', action='store', dest='ssh_key_name',
                        default='core')
    parser.add_argument('--env-file', action='store', dest='env_file',
                        default='production.env')
    parser.add_argument('--openstack-user', action='store',
                        dest='openstack_user',
                        default=os.environ.get('OS_USERNAME', None))
    parser.add_argument('--openstack-pass', action='store',
                        dest='openstack_pass',
                        default=os.environ.get('OS_PASSWORD', None))
    parser.add_argument('--openstack-url', action='store',
                        dest='openstack_url',
                        default=os.environ.get('OS_AUTH_URL', None))
    parser.add_argument('--openstack-tenant', action='store',
                        dest='openstack_tenant',
                        default=os.environ.get('OS_TENANT_NAME', None))
    parser.add_argument('--total-vms', action='store', type=int,
                        dest='total_vms', default=3)
    parser.add_argument('--total-public', action='store', type=int,
                        dest='total_public', default=1)
    parser.add_argument('--name', action='store', dest='cluster_name',
                        default='testing')
    parser.add_argument('--ip', action='store', dest='desired_ip',
                        default=None)
    parser.add_argument('--etcd-token', action='store', dest='etcd_token',
                        default=None)
    parser.add_argument('--region', action='store', dest='region',
                        default='NCSA')
    parser.add_argument('--net-id', action='store', dest='net_id',
                        default='165265ee-d257-43d7-b3b7-e579cd749ed4')
    parser.add_argument('--image-id', action='store', dest='image_id',
                        default='fd4d996e-9cf4-42bc-a834-741627b0e499')
    parser.add_argument('--dbvol-id', action='store', dest='dbvol_id',
                        default='e5b37fd8-1d7f-49f3-95bb-6c3127ee7199')
    parser.add_argument('--icatvol-id', action='store', dest='icatvol_id',
                        default='b89e0b67-9e93-4ab1-8e45-919a61c17e66')
    parser.add_argument('--moinmoin-id', action='store', dest='moinmoinvol_id',
                        default='1b74658a-9638-4db6-b7f3-1c2211f3776b')
    parser.add_argument('--flavor-id', action='store', dest='flavor_id',
                        default='7d41966f-dedd-4b3a-b56f-dfd0c604e8f5')
    args = parser.parse_args()

    if os.path.exists(args.ssh_key):
        with open(args.ssh_key, 'r') as fh:
            sshkey = fh.read()
    else:
        sys.exit("ssh-key (%s) does not exist. Set ssh-key with: --ssh-key SSH_KEY" % args.ssh_key)

    if os.path.exists(args.env_file):
        with open(args.env_file, 'r') as fh:
            environ = fh.read()
    else:
        sys.exit("environment file (%s) does not exist. Set environment file with: --env-file ENV_FILE" % args.env_file)

    if args.openstack_user is None or args.openstack_pass is None or args.openstack_tenant is None or args.openstack_url is None:
        sys.exit("openstack-user, openstack-pass, openstack-tenant and/or openstack-url not set. "
                 "Check your OpenStack environment variables or set the options via the "
                 "commandline. Run with -h for more details.")

    nt = client.Client(args.openstack_user, args.openstack_pass,
                       args.openstack_tenant, args.openstack_url,
                       service_type="compute")
    if args.etcd_token is None:
        args.etcd_token = requests.get("https://discovery.etcd.io/new").text

    for public, mounts, n in [
        (True, False, args.total_public),
        (False, True, 1),
        (False, False, args.total_vms - args.total_public - 1),
    ]:
        if n == 0:
            continue

        ip_info = "region=%s" % args.region
        if public:
            ip_info += ",elastic_ip=true,public_ip=$public_ipv4"
        else:
            ip_info += ",elastic_ip=false"
        if mounts:
            ip_info += ",mounts=true"
        else:
            ip_info += ",mounts=false"

        print ip_info
        with open('cloud-config_%s.yaml' % public, 'w') as fh:
            fh.write(CLOUD_CONFIG.substitute(etcd=str(args.etcd_token),
                                             sshkey="%s" % sshkey,
                                             ip_info=ip_info,
                                             envfile=environ))
        print "etcd token is", args.etcd_token

        # Verify flavor exists in OpenStack
        try:
            nt.flavors.find(id=args.flavor_id)
        except novaclient.exceptions.NotFound as e:
            sys.exit("Flavor id \"%s\" not found. Set flavor-id with: --flavor-id id" % args.flavor_id)

        # Verify image exists in OpenStack
        try:
            nt.images.find(id=args.image_id)
        except novaclient.exceptions.NotFound as e:
            sys.exit("Image id \"%s\" not found. Set image-id with: --image-id id" % args.image_id)

        # Verify network exists in OpenStack
        try:
            nt.networks.find(id=args.net_id)
        except novaclient.exceptions.NotFound as e:
            sys.exit("Network id \"%s\" not found. Set net-id with: --net-id id" % args.net_id)

        # Verify ssh_key_name exists in OpenStack
        try:
            nt.keypairs.get(args.ssh_key_name)
        except novaclient.exceptions.NotFound as e:
            sys.exit("SSH key name \"%s\" not found. Set ssh-key-name with: --ssh-key-name SSH_KEY_NAME" % args.ssh_key_name)

        created_servers = 0

        while int(created_servers) < int(n):

            print "Creating %s of %s instances" % (int(created_servers) + 1, n)

            instance = nt.servers.create(
                "coreos_%s" % args.cluster_name,
                args.image_id,
                args.flavor_id,
                security_groups=["default", "coreos"],
                userdata=open('cloud-config_%s.yaml' % public, 'r'),
                key_name=args.ssh_key_name,
                nics=[{"net-id": args.net_id}]
            )

            print "Instance ID: %s" % instance.id

            if mounts:
                while instance.status != 'ACTIVE':
                    print "%s Instance status: %s" % (time.strftime('%H:%M:%S'), instance.status)
                    time.sleep(10)
                    instance = nt.servers.get(instance.id)

                # Try to mount dbvol-id
                try:
                    # 3rd argument is unfortunately bogus...
                    nt.volumes.create_server_volume(
                        instance.id, args.dbvol_id, '/dev/vdd')
                except novaclient.exceptions.NotFound as e:
                    sys.exit("dbvol-id \"%s\" not found. Set dbvol-id with: --dbvol-id id" % args.dbvol_id)
                except novaclient.exceptions.BadRequest as e:
                    sys.exit("dbvol-id BadRequest: %s" % e.message)

                # Try to mount icatvol-id
                try:
                    # 3rd argument is unfortunately bogus...
                    nt.volumes.create_server_volume(
                        instance.id, args.icatvol_id, '/dev/vde')
                except novaclient.exceptions.NotFound as e:
                    sys.exit("icatvol-id \"%s\" not found. Set icatvol-id with: --icatvol-id id" % args.icatvol_id)
                except novaclient.exceptions.BadRequest as e:
                    sys.exit("icatvol-id BadRequest: %s" % e.message)

                # Try to mount moinmoinvol-id
                try:
                    # 3rd argument is unfortunately bogus...
                    nt.volumes.create_server_volume(
                        instance.id, args.moinmoinvol_id, '/dev/vdf')
                except novaclient.exceptions.NotFound as e:
                    sys.exit("moinmoin-id \"%s\" not found. Set moinmoin-id with: --moinmoin-id id" % args.moinmoinvol_id)
                except novaclient.exceptions.BadRequest as e:
                    sys.exit("moinmoin-id BadRequest: %s" % e.message)

                thismount = False
            if public:
                if args.desired_ip is None:
                    freeips = [
                        ip for ip in nt.floating_ips.list() if ip.fixed_ip is None]
                elif args.desired_ip.count('.') == 3:
                    freeips = [ip for ip in nt.floating_ips.list() if
                               ip.ip == args.desired_ip]
                else:
                    freeips = [nt.floating_ips.get(args.desired_ip)]
                if len(freeips) < 1:
                    exit("No free floating ips")
                ip = freeips[0].ip
                print "Adding IP", ip
                time.sleep(10)
                instance.add_floating_ip(freeips[0])
                print("export FLEETCTL_TUNNEL=%s" % ip)

            created_servers += 1

    print ("ETCD_TOKEN=%s" % args.etcd_token)
