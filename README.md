# NDS Labs

<img src="https://github.com/craig-willis/ndslabs/blob/master/docs/images/logos/NDS-badge.png" width="100" alt="NDS">

[![Join the chat at https://gitter.im/nds-org/ndslabs](https://badges.gitter.im/nds-org/ndslabs.svg)](https://gitter.im/nds-org/ndslabs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) ![Docker Automated build](https://img.shields.io/docker/automated/ndslabs/apiserver.svg?maxAge=2592000)

This is the main repository for the [National Data Service](http://www.nationaldataservice.org/) [Labs Workbench](https://www.workbench.nationaldataservice.org/) service.  

Labs Workbench is an experimental space for evaluating, developing, and exploring interoperability between research data management services. This is achieved through the use of applications containerized with [Docker](https://www.docker.com/what-docker), [Kubernetes](http://kubernetes.io/docs/whatisk8s/) for container orchestration, deployed on an [OpenStack](https://www.openstack.org/) cluster.

For more information, see the [architecture documentation](https://opensource.ncsa.illinois.edu/confluence/display/NDS/Workbench+Architecture).

On top of this foundation, NDS Labs provides a user interface, command line interface, and an API server used to manage the configuration and deployment of containerized services. This repository includes the following:

* apiserver: REST API server, a thin management layer over etcd and Kubernetes as well as the ndslabsctl command line utility
* gui: Project management UI implemented in AngularJS


# Service catalog 
The Labs Workbench includes a catalog of service specifications managed via
the [ndslabs-specs](https://github.com/nds-org/ndslabs-specs) repository. The catalog currenty contains over 50 services (and growing).

# For developers

The Labs Workbench is a hosted service and is not intended for installation. For Labs Workbench developers, it is possible to run the complete system on a single virtual machine or laptop. 

* To run a development copy of Labs Workbench, see https://github.com/nds-org/ndslabs-startup.
* To deploy Labs Workbench via Ansible on an OpenStack cluster, see https://github.com/nds-org/deploy-tools


# Where to get help

* [NDS Labs Google Group](https://groups.google.com/forum/#!forum/ndslabs/)
* [File an issue](https://github.com/nds-org/ndslabs/issues)
* [Find us on Gitter](https://gitter.im/nds-org/ndslabs)
* [NDS Wiki](https://nationaldataservice.atlassian.net/wiki/display/NDSC/NDS+Labs+Workbench)


# Contributing

For more information on our Developer Workflows, see [Developer Workflows](https://opensource.ncsa.illinois.edu/confluence/display/NDS/Developer+Workflows).

In short, fork this repository and make a pull request. We will review and give feedback.
