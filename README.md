# Adapt Builder [![Build Status](https://secure.travis-ci.org/adaptlearning/adapt_authoring.png)](http://travis-ci.org/adaptlearning/adapt_authoring)
 
A web-based authoring tool for the [Adapt Framework](https://community.adaptlearning.org/).

## Features

* Web application built on NodeJS and BackboneJS for creating, editing and publishing Adapt content
* Supports all core extensions and components
* Allows uploading and linking of course assets

## Installation

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

**If you installed FFmpeg:**

Navigate to the /conf/config.json and ensure the following property is set:
```
"useffmpeg" : true
```

## Run

Firstly ensure that the MongoDB service is started is running correctly. In the root of the project, run the following commands.

To compile the latest code (note this may take some time due to the size of the codebase):
```
grunt build
```

To run the code using the built-in webserver:
```
grunt server
```

Inspect the output from this task to work out which port the application is running on, and navigate to that address in your browser.

## To run unit tests:
```
make test
```

## To run CasperJS tests:
To run all the tests at once:

```
grunt test-ui
```

To run individual tests:

```
casperjs test test_frontend/testname.js
```

Screenshots of the steps in each test are stored in test_frontend/img.
