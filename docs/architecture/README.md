#NDSLabs Architecture#
The **NDSLabs** architecture provides ready-to-use services that provide cloud-based infrastructure and services for data-oriented projects and communities within the **National Data Service** community.   **NDSLabs** provides tooling for developers and site-providers, infrastructure-support for management and operations of NDS sites and projects, integrative services that connect individual site and project deployments into multi-site communities with common services such as search and publication, and systems primitives and services for building community-specific integrated distributed system services.
#Concepts and Terminology#
- **Infrastructure**:  The compute and storage resources in a cloud or infrastructure service (AWS, etc) that an NDS cluster runs on.  The NDS reference architecture is OpenStack.
- **Cluster/NDS cluster**:  The NDS software platform that runs on the infrastructure.
- **Project/Namespace**:  An isolated, named environment within the cluster that contains a set of services that are  managed and operated independently of other projects.   Projects typically implement the equivalent of a "website".
- **Administrator**:  An authenticated person that manages and operates a part of the system.


#Roles and Responsibilities#
 - **Infrastructure Administrator**: 
	* Provisions infrastructure to run a NDS cluster
		* On OpenStack, AWS, GCE, Rackspace, MaaS, ...
	* Deploys the NDS base cluster software
	* Registers resources from infrastructure with NDS cluster resource pool
	* Provides API and credential to Cluster Administrator
 - **Cluster Administrator**: 
	* Manages and operates the NDS cluster infrastructure
	* Manages Projects in the cluster
		* Provisions Projects on the cluster
		* Manages resource assignments from the cluster pool to project pools
		* Provides API and credentials per-project to Project Administrators
 - **Project Administrator**: 
	 - Provisions and deploys services in a project using resources granted to the project pool by the cluster administrator.
	 - Manages, monitors, and administrates services within independent projects. 
 - **User/Project User**: A client/user of the services within a project.
 - **Tool Provider**: A NDS partner that provides a tool or service in a set of containers that include NDS service descriptors to enable the service to be integrated in a NDS cluster.

#Architecture Overview#
The NDS architecture is based on the [Google Kubernetes](http://kubernetes.io/) system for managing containers in a cluster.   
##The Kubernetes Architecture: 
 ![Kubernetes Diagram](https://raw.githubusercontent.com/kubernetes/kubernetes/master/docs/design/architecture.png)
##The NDS Architecture: 
NDSLabs extends the Kubernetes base system with NDS-specific services and REST API's that support NDS cluster services, project services, inter-cluster NDS services.  The implementations of NDS services are implemented via cluster-specific Kubernetes pods and sidekick containers that are deployed in conjunction with service pods  in the cluster and in project-specific services that "extend" cluster-specific and project-specific pods with integration to services such a monitoring, volume management, etc.

 - **NDS Cluster Services**
	 - **API Manager**:  Manages cluster-wide **API naming** and  **public API exposure** from the cluster public IP firewall/load-balancing system.
	 - **Service Catalog**:  A dynamic, automatically updated catalog of NDS services available for deployment in the cluster (for cluster admins), and for projects (for project admins).   The service catalog manager is configured with NDS-specific container repositories, and periodically pulls service descriptions from the containers.
	 - **Project Manager**:  Provide the cluster administrator with **project provisioning** including **project admin credentials**.   Provides management of infrastructure resources to projects, including **volumes** and managing differentiated **compute resources**.
	 - **Cluster Monitor Service**:  Provides services for cluster administrators to monitor cluster operations, including **logging**, **performance analysis**, and **resource utilization**.  Monitor services include **ELK**, **Prometheus**, etc. in addition to Kubernetes-provided tools like **cadvisor**
 - **NDS Project Services**
	 - **Project Manager**:  Allows the project manager to **deploy, monitor, and manage application services** within their project.
	 - **Monitoring**:  Provides **Project-specific monitoring** of project resources, utilization, performance, and **application/service specific monitoring and logging.**
 - **Inter-cluster services**:  Provide NDS web services across multiple distributed clusters in the larger NDS context to implement global NDS services such as **global resource search**, **distributed data access**, and provide distributed application developers services to implement **service discovery** and **distributed API access** within their services.
	 - **Distributed search**:   Locating named data and services in the NDS global system.
	 -  **Resource discovery**:  Locates attribute-specified resources in the NDS global system, such as specifically sized **data-storage resources**, or **specific compute resources** such as HPC resources, or  accelerator-enabled compute resources, for example.


![**NDS Labs Architecture**](https://raw.githubusercontent.com/nds-org/nds-labs/v2/docs/architecture/architecture.png)
