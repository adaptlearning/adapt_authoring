#!/bin/bash

add-apt-repository ppa:mc3man/trusty-media
apt-get update
apt-get dist-upgrade
apt-get install -y build-essential libssl-dev
apt-get install -y git
apt-get install -y mongodb
apt-get install -y ffmpeg

# install nodejs via nodesource
curl -sL https://deb.nodesource.com/setup_0.12 | sudo bash -
apt-get install -y nodejs

# npm needs some swap space
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

npm install -g pm2
npm install -g grunt-cli
npm install -g adapt-cli

cd /vagrant/
npm install --production
node install --install Y --serverPort 5000 --serverName localhost --dbHost localhost \
  --dbName adapt-tenant-master --dbPort 27017 \
  --dataRoot data --sessionSecret your-session-secret --useffmpeg Y --name master --displayName Master --email admin --password password
