# Workbench Sphinx Documentation
This is the source for the [RTD documentation](https://ndslabs.readthedocs.io/en/latest/) for NDS Labs Workbench

# Dependencies
* Docker

# Development
Follow these steps to modify the documentation and contribute back to the project.

## Docker Compose (Automatic)
The following will build + run the image and watch for new changes to your source:
```bash
$ docker compose watch
```

Any changes to your source will automatically trigger Docker Compose to rebuild and rerun the newest image.

## Building the Documentation (Manual)
A build script has been included that will rebuild the Sphinx documentation from source:
```bash
./build.sh
```

You may get some red output stating that some directories are missing, but you should see something similar to the following:
```bash
build succeeded, 11 warnings.

The HTML pages are in _build/html.
```

## Testing your Changes
After you build the documentation, the generated HTML files are in `_build/html/`.

To test what your changes will look like, you can start a test webserver hosting your changed docs:
```bash
./serve.sh
```

You should now be able to access and test your changes to the documentation by navigating to `localhost:8080` in your browser.


### Using a different port
If port `8080` is already in use, you will get an error about failing to bind to the port.

For this case, the script accepts a port number as an optional argument.

Simply pick a different port that is not being used and rerun the script with that port number:
```bash
./serve.sh 8888
```

