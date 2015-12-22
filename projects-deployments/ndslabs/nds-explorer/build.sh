[ ! -d nds-explorer ] && hg clone https://bitbucket.org/nds-org/nds-explorer
cd nds-explorer
hg pull
hg up
npm install && bower install && grunt build
cd dist
tar cvfz ../../dist.tar.gz .
cd ../..
docker build -t "ndslabs/nds-explorer" .
