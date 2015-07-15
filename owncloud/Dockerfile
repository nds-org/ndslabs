FROM btobolaski/owncloud
MAINTAINER Matthew Turk "matthewturk@gmail.com"
RUN apt-get -y update
RUN apt-cache search php5
RUN cat /etc/lsb-release
RUN apt-get install -y apache2 php5-pgsql php5-ldap 
ADD setup_owncloud.sh /root/
ADD http_override.php /var/www/owncloud/lib/private/user/http.php
ENV owncloudpassword testpassword

CMD ["/root/setup_owncloud.sh"]
