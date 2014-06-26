# Adapt Core

An authoring library for the [Adapt](https://community.adaptlearning.org/) framework.

 [![Build Status](https://secure.travis-ci.org/adaptlearning/adapt_authoring.png)](http://travis-ci.org/adaptlearning/adapt_authoring)

## Features

* A complete back end for an Adapt authoring GUI

## Install

The tool currently requires that [MongoDB](http://www.mongodb.org) be installed and running. It can be installed by following this guide: 

http://docs.mongodb.org/manual/tutorial/install-mongodb-on-ubuntu/


If it is not installed already, you must install git (https://github.com/).
Run these commands in the terminal to install git:

```
sudo apt-get update
sudo apt-get install git
```

Now you must configure git:

```
git config --global user.name "Your Name"
git config --global user.email "youremail@domain.com"
```


[NPM] (https://www.npmjs.org/) and [Node.js] (http://nodejs.org/) are required. Installing Node.js from its website will also install NPM. If you choose to do this you should update NPM:

```
sudo npm install npm -g
```

You can also use one of the methods in the link below to install them.

https://gist.github.com/isaacs/579814


You must install [NVM] (https://github.com/creationix/nvm). Enter this command into the terminal to install it.

```
curl https://raw.githubusercontent.com/creationix/nvm/v0.8.0/install.sh | sh
```

You also require [Grunt] (http://gruntjs.com/). First, install Grunt's command line interface with this command. We will install Grunt locally to the Adapt folder later.

```
npm install grunt-cli -g
```

[FFmpeg] (https://www.ffmpeg.org/index.html) is optional. It is used to identify different file formats in the Asset Manager. 


With almost everything installed, you can clone the project from github:

```
git clone https://github.com/adaptlearning/adapt_authoring.git
```

Navigate to the folder you cloned the project to:

```
cd /the/project/directory
```

Checkout the development version:

```
git checkout develop
```

Next, you must install dependencies and Grunt locally.

```
npm install
npm install grunt
```

IF YOU INSTALLED FFmpeg:
Navigate to the conf folder in your project directory and open config.json. Add the following line to it:

```
"useffmpeg" : true
```


## Run

Ensure MongoDB is running. With the adapt_authoring folder opened in the terminal, run the following to build and run the code. Build can take some time to complete.

```
grunt build
grunt dev
node server
```



Terminal will tell you which port Adapt is running on, navigate to "localhost:xxx" where xxx is the port.


To run unit tests:

```
make test
```
