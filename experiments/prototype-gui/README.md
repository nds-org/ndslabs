NDS Labs Prototype GUI

How to run:
Execute the following commands to serve the GUI over port 80:
 git clone http://github.com/nds-org/nds-labs.git
 docker run -p 80:80 -v nds-labs/experiments/prototype-gui:/usr/share/nginx/html -it nginx

You should now be able to navigate a browser to the host's IP to see the prototype GUI.
