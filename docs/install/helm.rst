.. _setup-helm:

Setting up Helm 
===============

Labs Workbench uses the `Helm <https://helm.sh/>`_ package manager for
Kubernetes. This section describes how to setup Helm on your cluster.


There a number of ways to `install Helm
<https://docs.helm.sh/using_helm/#installing-helm>`_. A simple approach is to
run the Helm installer:

.. code:: bash

   curl https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get | bash

This will install the latest release of Helm.

After installing Helm on your system, you must initialize it in your Kubernetes
cluster:

First, setup a `ServiceAccount` for use by the `tiller`:

.. code-block:: bash

   kubectl --namespace kube-system create serviceaccount tiller


Next, give the `ServiceAccount` permissions to manage the cluster:

.. code-block:: bash

   kubectl create clusterrolebinding tiller --clusterrole cluster-admin \
      --serviceaccount=kube-system:tiller

Finally, initialize Helm in your cluster: 

.. code-block:: bash

   helm init --service-account tiller --wait

This command creates a `tiller` deployment in the `kube-system` namespace and
configures your local `helm` client.

For more information, see the `Helm
<https://docs.helm.sh/using_helm/#installing-helm>_` documentation.
