export OS_TENANT_ID=3836c0d58e3349b28fc740e33a58a7e3
export OS_USERNAME="willis8"
export OS_PASSWORD="zes3Drux"


curl  -s -X POST http://nebula.ncsa.illinois.edu:5000/v2.0/tokens -H "Content-Type: application/json" -d '{"auth": {"tenantId": "'"$OS_TENANT_ID"'", "passwordCredentials": {"username": "'"$OS_USERNAME"'", "password": "'"$OS_PASSWORD"'"}}}' 

#export OS_TOKEN=41c93825764845b988990ced6a9e2ae8
#curl -s -H "X-Auth-Token: $OS_TOKEN" http://nebula.ncsa.illinois.edu:8776/v2/$OS_TENANT_ID/

#-H "X-Auth-Token: $OS_TOKEN"
