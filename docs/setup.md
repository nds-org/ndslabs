# NDS Labs Setup
There are a few automated steps involved in setting up your own instance of NDS Labs.

## System Shell
The system-shell is a small docker image that contains everything needed to begin running your own instance of NDS Labs in minutes:
```bash
$ eval $(docker run --rm -it ndslabs/system-shell usage docker)
```

You should see Docker begin to pull the image. Once all layers of the image are pulled, you will dropped into the system-shell container:
```bash
Unable to find image 'ndslabs/system-shell:latest' locally
latest: Pulling from ndslabs/system-shell
ff12aecbe22a: Already exists
287750ad6625: Already exists
ca98bdf222fa: Already exists
a3ed95caeb02: Already exists
97ef68d67ea6: Pull complete
8c53c989a967: Pull complete
79d911a06f41: Pull complete
807cecd8f466: Pull complete
7f887f3746f8: Pull complete
0cadab32de06: Pull complete
aff97fd2a6c1: Pull complete
Digest: sha256:4128fff8a0234ee6cc25d077b7f607358e681370e5a483b6c89fe1a3dfc3e77e
Status: Downloaded newer image for ndslabs/system-shell:latest
[root@default NDSLabsSystem ] / # 
```

## Start Kubernetes
From the system-shell, run the following command to start running a local single-node Kubernetes cluster:
```bash
kube-up.sh
```

You can then execute `kubectl get svc,rc,pods` in order to see the status of your cluster. Once everything is up and running, the output should look as follows:
```bash
# kubectl get svc,rc,pods                  
NAME                      CLUSTER-IP   EXTERNAL-IP   PORT(S)     AGE
kubernetes                10.0.0.1     <none>        443/TCP     1m
NAME                      READY        STATUS        RESTARTS   AGE
k8s-etcd-127.0.0.1        1/1          Running       0          1m
k8s-master-127.0.0.1      4/4          Running       3          1m
k8s-proxy-127.0.0.1       1/1          Running       0          1m
```

### Start NDS Labs
Still inside of system-shell, run the following command to start running NDS Labs:
```bash
ndslabs-up.sh
```

Using the same `kubectl get svc,rc,pods` as before, you should now see that the API Server and the GUI are on your cluster:
```bash
# kubectl get svc,rc,pods                  
NAME                      CLUSTER-IP   EXTERNAL-IP   PORT(S)     AGE
kubernetes                10.0.0.1     <none>        443/TCP     3m
ndslabs-apiserver         10.0.0.184   nodes         30001/TCP   1m
ndslabs-gui               10.0.0.242   nodes         80/TCP      1m
NAME                      DESIRED      CURRENT       AGE
ndslabs-apiserver         1            1             1m
ndslabs-gui               1            1             1m
NAME                      READY        STATUS        RESTARTS   AGE
k8s-etcd-127.0.0.1        1/1          Running       0          3m
k8s-master-127.0.0.1      4/4          Running       3          3m
k8s-proxy-127.0.0.1       1/1          Running       0          3m
ndslabs-apiserver-pikrf   1/1          Running       0          1m
ndslabs-gui-urpqz         1/1          Running       0          1m
```

### Clowder Tool Server (Optional)
If you wish to experiment with the "Tool Server" addon for Clowder, you can run your own instance of the Tool Server from the system-shell:
```bash
toolsrv.sh
```

The tool server will print its Docker container id to signify that it has started:
```bash
# toolsrv.sh 
a14529e8b3c712956efe51c6bd94c7d6612eacc49c1fc09e158570162278d08d
```

When setting up an instance of Clowder, make sure to specify the **Public IP** of the machine where the Tool Server is running. This can be done from the "Advanced Configuration" section of the Configuration Wizard.

## Success!

Once the API Server and GUI are both **Running**, you should be able to navigate to the web interface using `http://YOUR_IP:30000`
