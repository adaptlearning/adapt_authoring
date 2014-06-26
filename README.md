# Adapt Core

An authoring library for the [Adapt](https://community.adaptlearning.org/) framework.

 [![Build Status](https://secure.travis-ci.org/adaptlearning/adapt_authoring.png)](http://travis-ci.org/adaptlearning/adapt_authoring)

## Features

* A complete back end for an Adapt authoring GUI

## Install

The tool currently requires that [MongoDB](http://www.mongodb.org) be installed and running. It can be installed by following the instructions for your operating system at the link below: 

* http://docs.mongodb.org/manual/


If it is not installed already, you must install git (https://github.com/).

* http://git-scm.com/downloads

* If you just installed git you must configure it:

```
git config --global user.name "Your Name"
git config --global user.email "youremail@domain.com"
```


[NPM] (https://www.npmjs.org/) and [Node.js] (http://nodejs.org/) are required. Installing Node.js from its website will also install NPM. After installation, ensure that NPM is updated. 



You must install [NVM] (https://github.com/creationix/nvm). 



Adapt also requires [Grunt] (http://gruntjs.com/). First, install Grunt's command line interface. Grunt must also be installed locally to each project which will be done later. Grunt is installed using NPM.

* http://gruntjs.com/getting-started



[FFmpeg] (https://www.ffmpeg.org/index.html) is optional. It is used to identify different file formats in the Asset Manager. 


Next the project must be cloned from Github before installing Grunt and any other dependencies:

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

Now you must install dependencies and Grunt locally.

```
npm install
npm install grunt
```

**IF YOU INSTALLED FFmpeg:**

Navigate to the conf folder in your project directory and open config.json. Add the following line to it:

```
"useffmpeg" : true
```


## Run

Ensure MongoDB is running. With the adapt_authoring folder opened in the terminal, run the following to build and run the code. Build can take some time to complete, and is not required every time unless the code is changed.

```
grunt build
grunt dev
node server
```



Terminal will tell you which port Adapt is running on, navigate to "localhost:xxx" in your browser where xxx is the port.


To run unit tests:

```
make test
```
