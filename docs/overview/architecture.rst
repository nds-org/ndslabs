************
Architecture
************

The following diagram illustrates the approximate architecture of the Workbench application:

.. image:: /images/admin/workbench-architecture.drawio.svg
  :width: 400
  :alt: Architecture diagram

Components
==========

* `NDS Labs Workbench <https://github.com/nds-org/ndslabs>`_
    * `Application Spec Catalog <https://github.com/nds-org/ndslabs-specs>`_
    * `Workbench Helm Chart <https://github.com/nds-org/workbench-helm-chart>`_
        * `Workbench WebUI <https://github.com/nds-org/workbench-webui>`_ (React)
            * Swagger UI
            * Redux Store
            * Websocket use for Console Exec
        * `Workbench API server <https://github.com/nds-org/workbench-apiserver-python>`_ (Python)
            * KubeWatcher
            * Websocket forwarding for Console Exec
        * Third-Party Dependencies
            * NFS Provisioner (ReadWriteMany) (`Server <https://artifacthub.io/packages/helm/nfs-ganesha-server-and-external-provisioner/nfs-server-provisioner>`_ or `Client <https://artifacthub.io/packages/helm/nfs-subdir-external-provisioner/nfs-subdir-external-provisioner>`_)
            * Ingress Controller (`Traefik <https://artifacthub.io/packages/helm/traefik/traefik>`_ or `NGINX <https://artifacthub.io/packages/helm/ingress-nginx/ingress-nginx>`_)
            * `OAuth2 Proxy <https://artifacthub.io/packages/helm/bitnami/oauth2-proxy>`_
            * `Keycloak <https://artifacthub.io/packages/helm/bitnami/keycloak>`_
            * `MongoDB <https://artifacthub.io/packages/helm/bitnami/mongodb>`_

.. include:: ../overview/terminology.rst
    :hidden:


What is an AppSpec?
-------------------

An **application specification** (AppSpec) contains all of the information necessary to run a containerized application

The only required pieces are as follows:
* `key`` is simply unique identifier for this application. This field may only contain alphanumeric characters (no special characters)
* Docker image name/tags of the application



What is a UserApp?
------------------

The information in the AppSpec is used to create a **user-specific instance of an app** (UserApp) 

Creating a UserApp creates the following resources on the Kubernetes cluster:

* ConfigMap (future: secret?) - environment variables for the application to use at runtime
* Ingress (optional) - allows users on the public internet to reach this application
* Service (optional) - allows other applications in the cluster to reach this application
* Deployment - Allows us to scale up (launch) or scale down (shutdown) the application while preserving the configuration
    * Mount: Home Data Volume PVC - each User has a Home volume that will be mounted in the `/home/` folder
    * Mount: Shared Data Volume PVC (optional) - if configured, Workbench will mount one or more shared data volumes 


Full Authentication Flow
========================

The auth flow presented here is fairly standard, and works with any app or apps that can make an HTTP request with credentials / cookies.

Acquiring a Valid Auth Token
----------------------------

1. User navigates to WebUI and clicks the Login button
2. User is sent to the OAuth2 Proxy's `/oauth2/start` endpoint
3. `/oauth2/start` begins the OAuth chain, which starts by automatically redirecting the User to Keycloak
    * If local accounts are enabled, you should see a Username/Password field
    * If one or more OIDC providers are configured, you should also see a button allowing you to login with those providers (e.g. GitHub, Google, CILogon, etc)
    * If ONLY OIDC is enabled, you will be redirected to the provider's login page 
4. (optional) if using OIDC, User logs in with provider credentials
5. After login, User is automatically redirected back to Keycloak's callback URL
6. Keycloak sets a few cookies in the User's browser before automatically redirects the user back to OAuth2 Proxy's callback URL
7. OAuth2 Proxy sets an `_oauth2_proxy` cookie in the User's browser containing an authorization token
8. OAuth2 Proxy automatically redirects the User back to the Workbench WebUI 

Finally, the User arrives back at the Workbench WebUI with a valid auth token set as a cookie. This cookie is sent to the Workbench API server with every subsequent request


Decoding the Auth Token
-----------------------

Anytime the WebUI or API server needs to decode this token, they can make a request to the `/oauth2/userinfo` endpoint that includes the token cookie.

The server will respond with a decoded token as a JSON document

The decoded token includes the following information:
* email
* username
* group membership



NGINX / Traefik Integrations
----------------------------

TODO: add more details here