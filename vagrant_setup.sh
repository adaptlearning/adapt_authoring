#!/bin/bash
#
# This script handles the provisioning of software for the machine.

# need this ppa for ffmpeg on trusty tahr
add-apt-repository ppa:mc3man/trusty-media
apt-get update
apt-get dist-upgrade
apt-get install -y build-essential libssl-dev
apt-get install -y git
apt-get install -y mongodb
apt-get install -y ffmpeg

# install nodejs via nodesource
curl -sL https://deb.nodesource.com/setup_4.x | sudo bash -
apt-get install -y nodejs

# npm needs some swap space, else it fails
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# global npm dependencies
npm install -g pm2
npm install -g grunt-cli
npm install -g adapt-cli

# upgrade the version of npm to help Windows users
# sudo npm install npm -g

# run the install with some default configuration settings
# url: http://localhost:5000
# username: admin
# password: password
cd /vagrant/
npm install --production
node install --install Y --serverPort 5000 --serverName localhost --dbHost localhost \
  --dbName adapt-tenant-master --dbPort 27017 \
  --dataRoot data --sessionSecret your-session-secret --useffmpeg Y \
  --smtpService dummy --smtpUsername smtpUser --smtpPassword smtpPass --fromAddress you@example.com \
  --name master --displayName Master --email admin --password password

  # upgrade the AuthoringTool and or Framework
  node upgrade --Y/n Y