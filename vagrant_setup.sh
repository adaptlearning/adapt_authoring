#!/bin/sh

cd /vagrant/
npm install
sudo npm install -g adapt-cli
adapt install
grunt build
echo "Done! Now you need to do the following:"
echo "  vagrant ssh"
echo "  cd /vagrant/"
echo "  node server"
echo "and open your browser to http://localhost:3000/install"

