# Getting started

## Setup
See the [setup documentation](https://github.com/nds-org/ndslabs/blob/master/docs/setup.md) for instructions on starting NDS Labs services.

## Tutorials
Once you have a running NDS Labs system, review the [tutorial](https://github.com/nds-org/developer-tutorial) for instructions on developing services and deploying them in NDS Labs

## Service catalog

The NDS Labs [service catalog](https://github.com/nds-org/ndslabs-specs/) repository contains example specifications and links to additional information about existing services.

## Where to get help

* [NDS Labs Google Group](https://groups.google.com/forum/#!forum/ndslabs/)
* [File an issue](https://github.com/nds-org/ndslabs/issues)
* [Find us on Gitter](https://gitter.im/nds-org/ndslabs)

## Walkthrough

### Login

From the login page you can either create a project or login to an existing profile:

![Login](images/quickstart/1login.png)

### Service list

After logging in, the list of available services is displayed on the left:
![Service list](images/quickstart/2canvas.png)

### Add ELK stack

Adding a stack displays the configuration wizard:
![Add Kibana](images/quickstart/3add.png)

### Required services

Required services are automatically added:
![Required services](images/quickstart/4add.png)

### Configure storage

If a service or dependent service requires persistent storage, you will have the opportunity to allocate storage:
![Configure volumes](images/quickstart/5volumes.png)

### Confirm

Confirm your configuration:
![Confirm](images/quickstart/6confirm.png)

### Stopped stack

The stack is added with no services started:
![Stopped stack](images/quickstart/7stopped.png)

### Starting stack

Selecting "Launch stack" starts the services. Dependent services are started first:
![Starting stack](images/quickstart/8starting.png)

### Started stack

Once the stack is started, you can view the stack configuration, logs, or access any endpoints:
![Started stack](images/quickstart/9started.png)

### View configuration

Viewing the configuration will show endpoint addresses or environment variables, if present:
![View config](images/quickstart/10config.png)

### View Kibana endpoint

Selecting the endpoint link allows access to the started service:
![Endpoint](images/quickstart/11kibana.png)

### View volumes
![View volumes](images/quickstart/12volume.png)

