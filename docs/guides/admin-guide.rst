.. _admin-guide:

***********
Admin Guide
***********

.. contents:: Table of Contents


.. include:: ../overview/terminology.rst
    :hidden:


Cluster Requirements
====================

The following third-party dependencies are required. These can optionally be installed by our Helm chart if they are not alrady provided on your cluster:

* NFS Provisioner (ReadWriteMany) (`Server <https://artifacthub.io/packages/helm/nfs-ganesha-server-and-external-provisioner/nfs-server-provisioner>`_ or `Client <https://artifacthub.io/packages/helm/nfs-subdir-external-provisioner/nfs-subdir-external-provisioner>`_)
    * Other RWM providers should work, but have not been tested
* Ingress Controller (`Traefik <https://artifacthub.io/packages/helm/traefik/traefik>`_ or `NGINX <https://artifacthub.io/packages/helm/ingress-nginx/ingress-nginx>`_)
    * Other Ingress Controllers should work, but have not been tested
* `OAuth2 Proxy <https://artifacthub.io/packages/helm/bitnami/oauth2-proxy>`_
* `Keycloak <https://artifacthub.io/packages/helm/bitnami/keycloak>`_
* `MongoDB <https://artifacthub.io/packages/helm/bitnami/mongodb>`_


The following third-party dependencies are optional, but recommended:

* `CertManager <https://artifacthub.io/packages/helm/cert-manager/cert-manager>`_: for automating renewal of Wildcard TLS certificates


Workbench Deployment Steps
==========================

The following steps can be used to deploy Workbench to any cluster where you have kubeconfig access.

For local development, we offer a Makefile to help get everything up and running in the proper order

For production deployments, we recommend setting up your own custom `Helm Configuration values <https://github.com/nds-org/workbench-helm-chart>`_


Local Development Instance
--------------------------

To contribute back to the Workbench platform, you can run a local development environment in a few quick steps

Prerequisites:

* `make` CLI
* `Git <https://git-scm.com/book/en/v2/Getting-Started-Installing-Git>`_ CLI
* `NodeJS / npm <https://nodejs.org/en/download/package-manager>`_,
* `Helm <https://helm.sh/docs/intro/install/>`_
* `Docker Desktop <https://www.docker.com/products/docker-desktop/>`_ 
* Make sure no other application is running on port 80/443


Setup Steps:

1. `Enable Kubernetes <https://docs.docker.com/desktop/kubernetes>`_ in Docker Desktop
    * This will run a small Kubernetes cluster on your local machine
2. Clone the `workbench-helm-chart` repo locally
    * `git clone https://github.com/nds-org/workbench-helm-chart && cd workbench-helm-chart/`
3. Edit the `.env` to setup your local config. The defaults should work as-is, but you may need to change the following:
    * `KUBE_CONTEXT=docker-desktop` the Kubernetes kubeconfig context to use. This should match the name of a `context` from `kubectl config get-contexts` file. See `Kubernetes Documentation <https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/>`_ for more details
    * `NAMESPACE=workbench` the Kubernetes namespace where Workbench will run 
    * `NAME=workbench` the name of the Helm release that will run Workbench
4. Run `make dev` to install all parts of the application. This will automatically do the following:
    * Verify that all dependencies are installed correctly
    * Update/fetch Helm dependency charts
    * Clone the webui/apiserver source code locally
    * Install frontend dependencies and use them to compile the source code
    * (if `REALM_IMPORT=true`) Create a configmap called `keycloak-realm` - this will automatically create a Keycloak realm named `workbench-dev` with all necessary groups and mappings
    * Deploy the Workbench Helm chart (with live-reload) with dependencies
    * Pull and run all required Docker images and bring the platform online
5. Run `make status` to verify that everything is starting up properly. You can also run `make watch` to watch for changes
    * Wait until all Volumes are `Bound` and all Pods are `Running`
6. Navigate your browser to https://kubernetes.docker.internal
    * You should see the Workbench Landing page load in your browser
7. Click the Login button to go to the Keycloak login page
8. Click the Register button at the bottom and create a Test User

After registraton, you should now be logged into the Workbench WebUI



Testing the Workbench API
^^^^^^^^^^^^^^^^^^^^^^^^^

If you're modifying the Workbench API, it can be helpful to test your changes using Swagger UI
This lets you test the API's raw request/reponse behavior without involving or changing the WebUI

To see Swagger UI, go to https://kubernetes.docker.internal/swagger
To use the authenticated endpoints (padlock icon), you can use the *POST /authenticate* endpoint

This endpoint takes your Test User username/password combination, and returns a token when successful
After authenticating, this token will be automatically added to all requests from Swagger UI

You can test this by executing the `/me` endpoint, which should now return information about the currently logged-in user



Production Deployment
---------------------

1. Copy `values.yaml` to create a new file named `values.myworkbench.yaml`
2. Edit `values.myworkbench.yaml` to your liking. Subcharts allow us to set configuration options on them as well. In particular, you may want to change:
    * Disable any sub-charts that you don't want to deploy with Workbench (e.g. NFS server, Keycloak, etc)
    * Edit `ingress.api.annotations` and `ingress.webui.annotations` to modify the Ingress annotations for the API / WebUI respectively
    * Edit `config.frontend.customization` section to customize the appearance/text of the WebUI
    * Edit `ingress.hostname` and `config.backend.domain` with your desired domain name
    * Edit `config.frontend.signin_url`, `config.frontend.signout_url`, and `config.backend.oauth.userinfoUrl` 
    * Edit `config.backend.namespace` and set this to the namespace where your UserApps should launch
    * Edit `config.backend.mongo` section and update/match MongoDB credentials throughout
    * Edit `config.backend.keycloak` section to point at a third-party Keycloak instance
    * Edit `config.backend.userapps.shared_storage` if you want to enable one or more Shared Data Volume
    * Edit `config.backend.userapps.annotations` to modify the Ingress annotations for UserApps
    * Edit `mongodb.autoimport` section to change which github repo is loaded during the `import-specs` job
    * Locate `kubernetes.docker.internal` throughout and replace with your own domain
3. Change your kubeconfig context to your desired cluster context: `kubectl config use-context <name>`
4. Deploy the Helm chart using your custom values: `helm upgrade --install --create-namespace -n <namespace> <name> . -f values.myworkbench.yaml`
    * By default, `namespace=workbench` and `name=workbench` - you can use any combination here to deploy multiple different Workbench instances to the same cluster

For a full reference of Helm chart configuration values, see https://github.com/nds-org/workbench-helm-chart
  
  


Keycloak Configuration Options
------------------------------

If you need to change the configuration of Keycloak, go to https://kubernetes.docker.internal/auth/
Default credentials: `admin` / `workbench`

After logging in, choose the `workbench-dev` realm from the dropdown at the top-left


Authorization Flows
^^^^^^^^^^^^^^^^^^^

When a user logs in via `browser` or `first broker login`, they are sent through an Authorization Flow

These flows can be customized by navigating to the **Authentication** page, although most of the built-in flows work very nicely without additional modifications.

Some examples:

* `browser` tells us how the user will be redirected to the Keycloak Login page (e.g. optionally skip Kecloak login and go to first provider)
* `first broker login` lets us customize what happens after a user logs in for the first time (create a user, merge with existing account matching email, etc)


Configuring OIDC
^^^^^^^^^^^^^^^^

By default, Keycloak only allows username/password auth. By configuring OIDC, you can allow your users to login to the platform with existing credentials from another system (e.g. GitHub, Google, Azure, etc)

First, create a new OAuth/OIDC Application within the chosen provider(s) (NOTE: this terminology may vary between providers). 

For example, with CILogon users can fill out https://cilogon.org/oauth2/register to receive these values

Here, the callback URL will be `https://<KEYCLOAKDOMAIN>/auth/realms/<REALM>/broker/<CLIENT>/endpoint`

* KEYCLOAKDOMAIN = Keycloak instance domain name
* REALM = Keycloak realm name
* CLIENT = Keycloak client name (you will create this below)

This should provide you with a ClientID + ClientSecret to use.

In Keycloak, create a new **Client** for each provider and specify your ClientID + ClientSecret when requested, and also set:

* First Login Flow = `browser` 
* Valid Redirect URLs = `https://<APPDOMAIN>/oauth2/callback`
* Default Scopes = *openid profile* + any other scopes desired
* Set Authorization URL / Token URL / User Info URL / etc according to your chosen provider

For a more detailed example of configuring OAuth2 Proxy authentiating via Keycloak, see `an example application <https://osc.github.io/ood-documentation/release-1.7/authentication/tutorial-oidc-keycloak-rhel7/configure-cilogon.html#configure-keycloak-with-cilogon>`_


Group Membership
^^^^^^^^^^^^^^^^

* **workbench-users** - allows user to login to Workbench (otherwise 403 is returned)
* **workbench-developers** - allows user access to create, modify, and launch custom UserApps
* **workbench-admin** - not currently used. (future: allow user to access admin-only API/UI functions)


Using an External Keycloak
^^^^^^^^^^^^^^^^^^^^^^^^^^

If you already have a running Keycloak instance that you would like to use, make sure you configure Mappers needed for OIDC via OAuth2 Proxy

For more information, see the `OAuth2 Proxy documentation <https://oauth2-proxy.github.io/oauth2-proxy/docs/configuration/oauth_provider#keycloak-oidc-auth-provider>`_

Audience
""""""""

Configure a dedicated audience mapper for your client by navigating to **Clients -> <your client's id> -> Client scopes**.

* Access the dedicated mappers pane by clicking **<your client's id>-dedicated**, located under Assigned client scope.
`(It should have a description of "Dedicated scope and mappers for this client")`
    * Click **Configure a new mapper** and select **Audience**
        * **Name** 'aud-mapper-<your client's id>'
        * **Included Client Audience** select `<your client's id>` from the dropdown.
            * *OAuth2 proxy can be set up to pass both the access and ID JWT tokens to your upstream services. If you require additional audience entries, you can use the Included Custom Audience field in addition to the "Included Client Audience" dropdown. Note that the "aud" claim of a JWT token should be limited and only specify its intended recipients.*
        * **Add to ID token** 'On'
        * **Add to access token** 'On' - `#1916 <https://github.com/oauth2-proxy/oauth2-proxy/pull/1916>`_
            * *Save the configuration.*

* Any subsequent dedicated client mappers can be defined by clicking **Dedicated scopes -> Add mapper -> By configuration ->** `Select mapper`

Groups
""""""

To summarize, the steps required to authorize Keycloak group membership with OAuth2 Proxy are as follows:

* Create a new Client Scope with the name **groups** in Keycloak.
    * Include a mapper of type **Group Membership**.
    * Set the "Token Claim Name" to **groups** or customize by matching it to the *--oidc-groups-claim* option of OAuth2 Proxy.
    * If the "Full group path" option is selected, you need to include a "/" separator in the group names defined in the *--allowed-group* option of OAuth2 Proxy. Example: "/groupname" or "/groupname/childgroup".

After creating the Client Scope named *groups* you will need to attach it to your client.
**Clients -> <your client's id> -> Client scopes -> Add client scope** -> Select **groups** and choose Optional and you should now have a client that maps group memberships into the JWT tokens so that Oauth2 Proxy may evaluate them.
