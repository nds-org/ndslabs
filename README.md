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

# Service catalog

NDS Labs includes a catalog of service specifications managed via
the [ndslabs-specs](https://github.com/nds-org/ndslabs-specs) repository.
For more information, see the [service catalog](https://opensource.ncsa.illinois.edu/confluence/display/NDS/NDS+Labs+Service+Specification) documentation.

Currently supported services include:
* Clowder (Clowder, MongoDB, ElasticSearch, RabbitMQ, extractors)
* Dataverse (Dataverse, Rserve, Solr, Postgres, TwoRavens, iRods)
* iRods (iCAT, Cloudbrowser)
* ELK (ElasticSearch, Logstash and Kibana)

# Getting started

# Where to get help

There are a few ways to get help for getting up and running.  The first is
through the NDS discussion mailing list, discuss@nationaldataservice.org.  Only
subscribers can post; to subscribe, email majordomo@nationaldataservice.org
with the contents "subscribe discuss".

The second way is through IRC.  On chat.freenode.net in the channel
\#nds-epiphyte , folks are often idling and able to respond to questions with
some delay.

# See also

* [ndslabs-clowder](https://github.com/nds-org/ndslabs-clowder): Docker image files for the Clowder example
* [ndslabs-irods](https://github.com/nds-org/ndslabs-irods): Docker image files for the iRODS example
* [ndslabs-dataverse](https://github.com/nds-org/ndslabs-dataverse): Docker image files for the Dataverse example
* [ndslabs-system-shell](https://github.com/nds-org/ndslabs-system-shell): Docker image with NDS Labs system tools
* [ndslabs-developer-shell](https://github.com/nds-org/ndslabs-developer-shell): Docker image for NDS Labs developers
* [ndslabs-deploy-tools](https://github.com/nds-org/ndslabs-deploy-tools): Cluster deployment tools.
