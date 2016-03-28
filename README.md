# NDS Labs

This is the main repository for the [National Data Service](http://www.nationaldataservice.org/) [NDS Labs](http://labsportal.nationaldataservice.org/) initiative.  

NDS Labs is designed to be an experimental space for developing and exploring interoperability between services. This is achieved through the use of services containerized with [Docker](https://www.docker.com/what-docker), [Kubernetes](http://kubernetes.io/docs/whatisk8s/) for container orchestration, deployed on an [OpenStack](https://www.openstack.org/) cluster.

For more information, see the [architecture documentation](https://github.com/nds-org/ndslabs/tree/master/docs/architecture).

On top of this foundation, NDS Labs provides a user interface, command line interface, and an API server used to manage the configuration and deployment of containerized services. This repository includes the following:

* apiserver: NDS Labs REST API server, a thin management layer using etcd, Kubernetes, and OpenStack APIs.
* gui: Project management UI implemented in angular.
* apictl: Command line utiliy.

# Requirements

* For developers, NDS Labs servics can run on any system with Docker 1.9+.
* For production deployment, NDS Labs assumes an OpenStack cluster


# See also

* (ndslabs-specs)[https://github.com/nds-org/ndslabs-specs]: Catalog of service specifications
* (ndslabs-clowder)[https://github.com/nds-org/ndslabs-clowder]: Docker image files for the Clowder example
* (ndslabs-irods)[https://github.com/nds-org/ndslabs-irods]: Docker image files for the iRODS example
* (ndslabs-dataverse)[https://github.com/nds-org/ndslabs-dataverse]: Docker image files for the Dataverse example
* (ndslabs-system-shell)[https://github.com/nds-org/ndslabs-system-shell]: Docker image with NDS Labs system tools
* (ndslabs-developer-shell)[https://github.com/nds-org/ndslabs-developer-shell]: Docker image for NDS Labs developers
* (ndslabs-deploy-tools)[https://github.com/nds-org/ndslabs-deploy-tools]: Cluster deployment tools.


The rough outline for getting started with a pre-built cluster of NDS Labs
containers is as follows:

 1. Import the CoreOS images into Glance as per instructions at coreos.com
 2. Read over the output of:
    $ python2.7 startup_ndslabs.py --help
 3. Run the startup script with the appropriate options.
 4. Spawn the appropriate servicefiles using fleetctl

Each of the options to startup_ndslabs.py is documented.  A typical invocation
will specify Openstack volumes to mount, the SSH key to use, a name, and a
public IP address.

Where to Get Help
-----------------

There are a few ways to get help for getting up and running.  The first is
through the NDS discussion mailing list, discuss@nationaldataservice.org.  Only
subscribers can post; to subscribe, email majordomo@nationaldataservice.org
with the contents "subscribe discuss".

The second way is through IRC.  On chat.freenode.net in the channel
\#nds-epiphyte , folks are often idling and able to respond to questions with
some delay.


What's Next?
------------

Once you have started up the cluster, you are now able to create new docker
files that interoperate with existing services.  (See the list of services
below for more information.)  These can be spawned using servicefiles.

All services, docker images and service files are designed to be nearly
completely configurable at time of first instantiation by environment
variables.  If they are backed by a persistent container (or linked to a
persistent database container) they should restart cleanly with existing
configuration.

List of Services
----------------

Below are the services currently included.  To inspect which environment
variables they take, examine the dockerfile for ENV lines.

 * busybox
 * docker-registry-frontend
 * docker-registry
 * hipache
 * irods-icat
 * irods-idrop2
 * irods-rest
 * kallithea
 * moinmoin
 * owncloud
 * postgres-icat
 * postgres-owncloud
 * proxy
 * rabbitmq
 * webserve
 * ytwebapp
 * scidrive (planned, not yet implemented)

Special Services
----------------

Some services are templated to allow for special use cases.  The most prominent
of these is the webserve service, which is designed to spin up any
appropriately named docker image.  This is to make it extremely easy to serve
static content.  For an example of how to do this, see the nds-explorer
Dockerfile (which builds a dist.tar.gz and inserts it into the dockerfile);
this service can be spawned by executing

 $ fleetctl start webserve@nds-explorer.service

This will feed the portion of the name between the @ symbol and the . into the
servicefile as %i.  It then downloads the image nds-labs/%i , executes it, and
sets up an http proxy from the public IP address to the appropriate internal IP
address.  At the public IP, under the suburl nds-explorer, it will now serve
the content of that container.

Configuration Variables
-----------------------

Below is a selection of environment variables that relate to configuration
settings for the services.  Not all will need to be changed; in fact, at a bare
minimum, none of them need to be changed.

To change an environment variable, modify the contents of
docker-launcher/production.env .

 * IRODS_DATADIR defaults to /tempZone/home/rods/data .  What is the location,
   in iRODS-space, of the data to be made available?
 * irodspassword defaults to testpassword and is the password for the irods
   postgres database.
 * irodsresc defaults to defaultResc and is the resource on which files will be
   created, by default.
 * irodszone defaults to tempZone and is the iRODS Zone to be used.
 * kemail defaults to nn@your.kallithea.server and is the email address
   Kallithea will use for logging and reporting.
 * keyforagent defaults to temp_32_byte_key_for_agent__conn and is the key used
   in the iRODS setup.
 * kpass defaults to simple_password and is the administrative password for
   Kallithea.
 * localzonesid defaults to TEMP_LOCAL_ZONE_SID and is the zone SID for iRODS
   setup.
 * owncloudpassword defaults to testpassword and is the password for admin on
   ownCloud.
 * ytfidopassword defaults to 3nthr0py and is the password for the ytfido user
   account on iRODS.

