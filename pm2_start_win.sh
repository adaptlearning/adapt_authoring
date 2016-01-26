#!/bin/bash
#
# just a simple script to start the app using pm2

cd /home/vagrant/
pm2 start processes.json
