FROM postgres:latest
ENV irodspassword testpassword
RUN mkdir -p /docker-entrypoint-initdb.d/
ADD setup-icat.sh /docker-entrypoint-initdb.d/
