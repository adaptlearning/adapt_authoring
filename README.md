# Adapt Builder [![Build Status](https://secure.travis-ci.org/adaptlearning/adapt_authoring.png)](http://travis-ci.org/adaptlearning/adapt_authoring)
 
A web-based authoring tool for the [Adapt Framework](https://community.adaptlearning.org/).

## Features

* Web application built on NodeJS, BackboneJS, and MongoDB for creating, editing and publishing Adapt content
* Supports all core extensions and components
* Allows uploading and linking of course assets

## Installation

### Prerequisites

* git - [http://git-scm.com/downloads](http://git-scm.com/downloads)
* MongoDB - [http://docs.mongodb.org/manual/](http://docs.mongodb.org/manual/)
* Node.js - [http://nodejs.org/](http://nodejs.org/)
* grunt-cli - [http://gruntjs.com/getting-started](http://gruntjs.com/getting-started)
* adapt-cli - [https://github.com/adaptlearning/adapt-cli](https://github.com/adaptlearning/adapt-cli)
* FFmpeg (optional) - [https://www.ffmpeg.org/index.html](https://www.ffmpeg.org/index.html)

There are various ways of installing these applications depending on your platform.

[Installing prerequisites on Windows](README-windows.md)

Users on platforms other than Windows can use the instructions below.

### Installation of Prerequisite Applications

Before installing the tool itself, you must install the following applications.

#### Git

You can install git from [here](http://git-scm.com/downloads).

If this is a fresh install of git, you should configure it:

```
git config --global user.name "Your Name"
git config --global user.email "youremail@domain.com"
```

#### MongoDB

[MongoDB](https://www.mongodb.org) is a document based database. Download and install the version appropriate for your system [here](https://www.mongodb.org/downloads).  


#### NodeJS & NPM

[NodeJS](http://nodejs.org/) and [NPM](https://www.npmjs.org/) are required. Installing Node.js will also install NPM.

The NodeJS version should must be 0.10.33. Earlier versions of NodeJS are less stable and the code is currently not compatibile with 0.12.x.

You should use a NodeJS version manager. We recommend using [NVM](https://github.com/creationix/nvm) on non-Windows machines. On Windows, try [nodist](https://github.com/marcelklehr/nodist)

#### Grunt and Adapt Command Line Tools

Install [grunt-cli](http://gruntjs.com/) and [adapt-cli](https://github.com/adaptlearning/adapt-cli) using npm (NOTE the `-g` in both commands is required!):

```
npm install -g grunt-cli
npm install -g adapt-cli
```
Read more about [Grunt](http://gruntjs.com/getting-started)


#### FFMPEG (optional, but recommended)

[FFmpeg](https://www.ffmpeg.org/index.html) is not required to use the tool, but it will produce nice thumbnails for images and videos you upload. 

### Clone the adapt_authoring project

Clone the project from github.com:

```
git clone https://github.com/adaptlearning/adapt_authoring.git
```

### Run the install script

Firstly ensure that the MongoDB service is started is running correctly. If you installed on Linux, the service should automatically start. OSX users may have to manually run `mongod` from a terminal. 

Navigate to the folder where you cloned the adapt_authoring project and run `npm install`:

```
cd /path/to/adapt_authoring/
npm install

```

And finally run the install script. The script will help you configure the tool. In most cases, you can just accept the default values; the only input you are required to provide are the default username and password. Note that FFmpeg is not used by default, so choose `Y` when prompted if you have it installed:

````
node install
````
If the script completes succesfully, you should now be able to run the application. If any error occurs, read the output, and check if you forgot to install one of the above prerequisites.

To run the application use:

````
node server
````

The ouput on the console will tell you what url to use to access the tool. By default it will be [http://localhost:5000](http://localhost:5000). 

You can run the install script again at anytime. If you chose the same values for the master database connection, you may overwrite any existing data, but this is occasionally desired.

We hope you enjoy using the tool! For help and support, please visit the community page at [http://community.adaptlearning.org](http://community.adaptlearning.org)