.. _setup-workbench:

Setting up Workbench
====================

Labs Workbench uses the `Helm <https://helm.sh/>`_ package manager for
Kubernetes. This section describes how to install Workbench and 
prerequisites on your cluster.


Before you start
----------------

Labs Workbench has a few prerequisites:

* Kubernetes cluster (can be Minikube or kubeadm)
* Helm 
* `ReadWriteMany` storage provisioner for home directories
* NGINX ingress load balancer
* Wildcard DNS and TLS certificate

Storage Options
---------------

Labs Workbench uses two types of `PersistentVolumeClaims`:

* `ReadWriteOnce` claim for `etcd` store
* `ReadWriteMany` claim for user volumes

Storage options available to you depend on your cloud provider and Kubernetes
configuration. Since some cloud providers do not support `ReadWriteMany` storage
options by default, we recommend using a simple NFS provisioner. 

Note, on GKE you'll need to create a `ClusterRoleBinding` for your account:

.. code:: bash

   gcloud info | grep Account
   Account: [myname@example.org]

   kubectl create clusterrolebinding you-cluster-admin-binding --clusterrole=cluster-admin  \
       --user=you@gmail.com

An example is NFS provider is available: 
.. code:: bash

   git clone https:/github.com/nds-org/workbench-helm-chart
   cd nfs-example
   kubectl create -f deployment.yaml -f rbac.yaml -f class.yaml

This creates an `nfs` storage class backed by an `nfs-provisioner`. The
provisioner itself uses a `ReadWriteOnce` volume from the cloud provider's
default storage class.


Installing the NGINX Ingress Controller
---------------------------------------

Labs Workbench uses the NGINX Ingress Controller in both OpenStack and GKE
deployments. To install it:

.. code:: bash

   helm install --name nginx-ingress stable/nginx-ingress --set rbac.create=true


Installing Labs Workbench
-------------------------

Now we're ready to install Labs Workbench:

.. code::

   git clone https://github.com/nds-org/workbench-helm-chart 
   cd workbench-helm-chart/

You'll need to edit a few of the settings in `values.yaml`:

* `domain`: Base domain for wildcard DNS (e.g., workbench.ndslabs.org) 
* `email_address`: Email address used as from address in outgoing emails
* Wildcard TLS certificate: Self-signed or valid wildcard certificate for domain 
* `smtp`: In-cluster SMTP server or Gmail username/app password

And deploy the chart:
.. code::

   helm install . --name=workbench --namespace=workbench --wait

If you change your configuration, you can upgrade the chart:
.. code::

   helm upgrade workbench .

