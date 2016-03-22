# NDSLabs Web Interface

## Getting Started
Building / modifying this code is not necessary unless you want to make modifications to the interface.

Simply run the following command to retrieve a pre-built copy of the image:
```bash
docker pull ndslabs/ndslabs-gui:latest
```

## Modifying the GUI
Several helper scripts are included to help you modify this code:
* build.sh:     Builds the ndslabs/ndslabs-gui docker image.
* start.sh:     Create a container from the ndslabs/ndslabs-gui image.
* stop.sh:      Remove the running cloud9 / ndslabs-gui container(s).
* swagger.sh:   Regenerate the REST API spec from Swagger.

### build.sh
Builds the ndslabs/ndslabs-gui docker image.

Usage:
```bash
./build.sh [-c] [-p]
```

Args:
* -c: Clean (remove) the existing image before building the new one.
* -p: Push the new image after building it.

### start.sh
Create a container from the ndslabs/ndslabs-gui image and, optionally, open an IDE allowing dynamic changes.
This will remove the containers first, if they already exist.

Usage:
```bash
./start.sh [-c] [-d|--dev]
```

Args:
* -c:          (debug mode)       Run bash to open a console, instead of starting the http-server.
* -d or --dev: (developer mode)   Start the container in developer mode instead.

NOTE: -d will start an instance of the Cloud9 IDE, allowing you to modify the GUI on-the-fly.

### stop.sh
Remove the running cloud9 / ndslabs-gui container(s).

Usage:
```bash
./stop.sh
```

### swagger.sh
Regenerate the REST API spec from Swagger

Usage:
```bash
./swagger.sh [URL]
```

Args:
* URL: The remote URL from which to download the swagger spec.

NOTE: If no URL is provided, the file locaated at ../apis/swagger-spec/ndslabs.json will be used instead.
