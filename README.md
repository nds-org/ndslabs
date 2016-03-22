# NDSLabs Web Interface

## Getting Started
Building / modifying this code is not necessary unless you want to make modifications to the interface.

Simply run the following command to retrieve a pre-built copy of the image:
```bash
docker pull ndslabs/ndslabs-gui:latest
```

## Modifying the GUI
Several helper scripts are included to help you modify this code:
* build.sh: Builds the ndslabs-gui docker image
* develop.sh: Create a container from the ndslabs-gui image, map this directory into it, and run a cloud9 IDE with the same mapping 
* run.sh: Create a container from the ndslabs-gui image
* swagger.sh: Regenerate the REST API spec from Swagger
