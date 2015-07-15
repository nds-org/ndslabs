FROM postgres:latest
ENV owncloudpassword testpassword
RUN mkdir -p /docker-entrypoint-initdb.d/
ADD setup-owncloud.sh /docker-entrypoint-initdb.d/
