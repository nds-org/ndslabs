# NDSLabs Web Interface

## Getting Started
Building / modifying this code is not necessary unless you want to make modifications to the interface.

Simply run the following command to retrieve a pre-built copy of the image:
```bash
docker pull ndslabs/ndslabs-gui:latest
```

## Modifying the GUI
Several helper scripts are included to help you modify this code:
* build.sh: Builds the ndslabs/ndslabs-gui docker image
* develop.sh: Create a container from the ndslabs/ndslabs-gui image, map this directory into it, and run a cloud9 IDE with the same mapping 
* run.sh: Create a container from the ndslabs/ndslabs-gui image
* swagger.sh: Regenerate the REST API spec from Swagger

### build.sh
Builds the ndslabs/ndslabs-gui docker image.

Usage:
```bash
./build.sh [-c] [-p]
```

Args:
* -c: Clean (remove) the existing image before building the new one.
* -p: Push the new image after building it.

### develop.sh
Create a container from the ndslabs/ndslabs-gui image, map this directory into it, and run a cloud9 IDE with the same mapping.

Usage:
```bash
./develop.sh
```

Args:
None

### run.sh
Create a container from the ndslabs/ndslabs-gui image

Usage:
```bash
./run.sh [-c] [-d|--dev]
```

Args:
* -c: Run bash to open a console, instead of starting the server.
* -d or --dev: Start the container in developer mode instead.

### swagger.sh
Regenerate the REST API spec from Swagger

Usage:
```bash
./swagger.sh [URL]
```

Args:
* URL: The remote URL from which to download the swagger spec.

NOTE: If no URL is provided, the file locaated at ../apis/swagger-spec/ndslabs.json will be used instead.
