# Adapt Builder [![Build Status](https://secure.travis-ci.org/adaptlearning/adapt_authoring.png)](http://travis-ci.org/adaptlearning/adapt_authoring)
 
A web-based authoring tool for the [Adapt Framework](https://community.adaptlearning.org/).

## Features

* Web application built on NodeJS and BackboneJS for creating, editing and publishing Adapt content
* Supports all core extensions and components
* Allows uploading and linking of course assets

## Installation
###Windows

The authoring tool is only fully tested with version 0.10.2. 
Please check your current node version (`node -v`). 

If it is not 0.10.2 then we recommend using a version manager for node.

####nodist
https://github.com/marcelklehr/nodist
installs latest nodejs+npm on first run    

1. uninstall existing node installations
    
    >note for windows 8:
    >delete nodejs folder because there is no uninstall

2. `git clone git://github.com/marcelklehr/nodist.git` (or grab the [zip](https://github.com/marcelklehr/nodist/zipball/master))  
   (Note that certain paths, e.g. `Program Files`, require admin rights!)

3. `setx /M PATH "path\to\nodist\bin;%PATH%"` ([setx not available?](http://www.computerhope.com/issues/ch000549.htm))

4. `setx /M NODIST_PREFIX "path\to\nodist"`

5. Run `nodist selfupdate` (updates the dependencies and sets npm's global prefix)

6. Run `nodist 0.10.2` (the builder is only fully tested with version 0.10.2)

####node modules

* install `npm install grunt-cli -g`
* install `npm install adapt-cli -g`

####Install FFMPEG
* download a static build from [here](http://ffmpeg.zeranoe.com/builds/)
* unpack it anywhere
* run cmd as administrator
* add it to the systemvariables `setx /M PATH "path\to\ffmpeg\bin;%PATH%"` 


####Install MongoDB
* download mongodb from [here](http://www.mongodb.org/downloads)
* run the installer
* create mongo data folder in your root (C:\data\md)
* (optional) http://docs.mongodb.org/manual/tutorial/install-mongodb-on-windows/#manually-create-a-windows-service-for-mongodb


####Running the authoring tool

If you chose to install mongodb as a service start it with `net start MongoDB` and skip steps 1 and 2

1. run `mongod.exe`
2. run `mongo.exe`
3. run a new cli window and change to the directory of the authoring tool code
4. run `npm install`
5. run `node server`
6. run a new cli window and change to the directory of the authoring tool code
7. run  `grunt server`
8. Open browser at `localhost:3000`

### Linux/Mac
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
_**Windows users**_: most probably ffmpeg and ffprobe will not be in your %PATH Environment Variables, so you must set %FFMPEG_PATH and %FFPROBE_PATH.  It is imporatant that you enter the full path to the .exe files here.  (This project uses the [node-fluent-ffmpeg] (https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) API.)

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
