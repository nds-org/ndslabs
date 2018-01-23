# Integration testing with Postman/Newman

Labs Workbench uses [Postman](https://www.getpostman.com/) for API integration testing. This directory contains a Postman collection and environment intended for executing API tests against a running instance of Labs Workbench.  Postman can be used interactively or [Newman](https://www.getpostman.com/docs/postman/collection_runs/command_line_integration_with_newman) for command line execution

## Using Postman

Download free [Postman application](https://www.getpostman.com/) for your OS.

### Import the collection

In Postman, select "Import" and browse to this directory. Select ``Workbench.postman_collection.json``. You should now see a collection called "Workbench".

### Import the environment
Select the settings cog next to the environments drop-down then "Manage Environments". Select the "Import" button and browse to this directory. Import "workbench.postman_environment.json".  You can edit the environment as needed.

### Export the collection
In Postman, select the Workbench collection then select the "Download Collection" link. Select v2.1 format and save the collection to this directory.

### Export the environment
In Postman, select the "workbench" environment, then the settings cog, then "Manage Environments" and "Download Environment". Save the file to this directory as ``workbench.postman_environment.json``


### Running tests
Select the test and select "Send".  Note the "Tests" and "Test results" tabs.


## Using Newman
While Newman can be installed via ``npm``, it's probably easiest to use an official [Docker image](https://hub.docker.com/r/postman/newman_alpine33/).

```
docker pull postman/newman_alpine33
```

```
docker run -v `pwd`:/etc/newman -t  postman/newman_alpine33  --insecure --collection=Workbench.postman_collection.json --environment=workbench.postman_environment.json
```


## See also
* [Postman Documentation](https://www.getpostman.com/docs/)
* [Creating collections](https://www.getpostman.com/docs/postman/collections/creating_collections)
* [Test examples](https://www.getpostman.com/docs/postman/scripts/test_examples)
