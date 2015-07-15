import os

c = get_config()
c.NotebookApp.ip = '*'
c.NotebookApp.port = 8888
c.NotebookApp.open_browser = False

prefix = os.environ.get("HOST_PREFIX", "/")
c.NotebookApp.base_project_url = prefix
c.NotebookApp.base_kernel_url = prefix
c.NotebookApp.webapp_settings = {'static_url_prefix': '%s/static/' % prefix}
