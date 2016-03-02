#!/bin/bash

curl -s -d "{\"username\": \"demo\", \"password\": \"12345\"}" -H "Content-Type:application/json" http://localhost:8083/authenticate

#HEADERS=("--header" "Authorization: Bearer ${TOKEN}" "--header" "Content-Type: application/json")
