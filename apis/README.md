# Workbench Swagger REST API Documentation
This is the source for the Swagger UI for NDS Labs Workbench REST API.

# Dependencies
* Docker

# Building the Documentation
A build script has been included that will rebuild the Swagger documentation from source:
```bash
./build.sh
```

You should see something similar to the following:
```bash
[main] INFO io.swagger.codegen.AbstractGenerator - writing file /usr/src/swagger-ui/index.html
[main] INFO io.swagger.codegen.AbstractGenerator - writing file /usr/src/swagger-ui/.swagger-codegen/VERSION
```

# Testing your Changes
After you build the documentation, the generated HTML files are in `swagger-ui/`.

To test what your changes will look like, you can start a test webserver hosting your changed docs:
```bash
./serve.sh
```

You should now be able to access and test your changes to the documentation by navigating to `localhost:8080` in your browser.


## Using a different port
If port `8080` is already in use, you will get an error about failing to bind to the port.

For this case, the script accepts a port number as an optional argument.

Simply pick a different port that is not being used and rerun the script with that port number:
```bash
./serve.sh 8888
```

