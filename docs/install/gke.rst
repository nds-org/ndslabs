.. _setup-gke:

Quickstart Install on GKE
=========================


Using the Google Cloud UI or `gcloud`, create a Kubernetes cluster:

.. code:: bash

   gcloud container clusters create [CLUSTER_NAME] [--zone [COMPUTE_ZONE]]


Setup a `ClusterRoleBinding` for your account:

.. code:: bash

   gcloud info | grep Account
   Account: [myname@example.org]

   kubectl create clusterrolebinding myname-cluster-admin-binding --clusterrole=cluster-admin  \
       --user=myname@example.org

On the Cloud Console or your local system, install and configure Helm:

.. code:: bash

   curl https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get | bash
   kubectl --namespace kube-system create serviceaccount tiller
   kubectl create clusterrolebinding tiller --clusterrole cluster-admin  \ 
      --serviceaccount=kube-system:tiller
   helm init --service-account tiller --wait


Install the NGINX Ingress Controller:

.. code:: bash

   helm install --name nginx-ingress stable/nginx-ingress --set rbac.create=true


Clone the Workbench chart:

.. code:: bash

   git clone https:/github.com/nds-org/workbench-helm-chart -b gke


Create an in-cluster NFS server to support ReadWriteMany volume claims:

.. code:: bash

   cd nfs-example
   kubectl create -f deployment.yaml -f rbac.yaml -f class.yaml


Configure Workbench `values.yaml`:

* Set `domain` to a wildcard DNS entry.  Contact us if you need something (e.g., `project.ndslabs.org`)
* Set `support_email` to a valid Gmail account
* Set `smtp.gmail_user` and `smtp.gmail_password` to your Gmail account and an app password
* Create a self-signed cert using `generate-self-signed-cert.sh <domain>` and paste into `tls.cert` and `tls.key` sections.

Install Workbench chart:

.. code:: bash

   helm install . --name=workbench --namespace=workbench

Once the pods are running, you should be able to access your instance at
https://www.project.ndslabs.org). Click "Sign Up" to register an account.  With
the default chart settings, you will be required to verify your email address
and the `support_email` account will receive a message to approve/deny
registration.  After approval, login to your account and launch the File
Manager. Confirm that you can access the File Manager UI.
