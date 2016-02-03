# Adapt Builder [![Build Status](https://secure.travis-ci.org/adaptlearning/adapt_authoring.png)](http://travis-ci.org/adaptlearning/adapt_authoring)

[![Join the chat at https://gitter.im/adaptlearning/adapt_authoring](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/adaptlearning/adapt_authoring?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
 
A web-based authoring tool for the [Adapt Framework](https://community.adaptlearning.org/).

## Features

* Web application built on Node.js, Backbone.js, and MongoDB for creating, editing and publishing Adapt content
* Supports all core extensions and components
* Allows uploading and linking of course assets

## Vagrant Installation

You can either install the authoring tool as a web application (see [Server Installation](#server-installation)), or as a Vagrant installation running on Virtual Box.

If you are a non-technical user, the Vagrant option is the quicker and easier option.

The steps for installing on Vagrant are:

1. Install [Vagrant](https://docs.vagrantup.com/v2/installation/).
2. Install [VirtualBox](https://www.virtualbox.org/wiki/Downloads).
3. Get the code by downloading a zip [directly from GitHub](https://github.com/adaptlearning/adapt_authoring/releases), or [by cloning the repository using git](#clone-the-adapt_authoring-project).
4. Launch a terminal window (or command prompt) and `cd` into the `adapt_authoring` directory you have just downloaded.  (**Windows users**: it is essential that you launch command prompt as an Administrator.). <br/>*If you're unfamiliar with the terminal, have a look at our [Just Enough Command Line for Installing](https://github.com/adaptlearning/adapt_authoring/wiki/Just-Enough-Command-Line-for-Installing) page first.*  
5. Run the command `vagrant up`.  (**Windows users**: during this process you may receive prompts from your firewall software, to which you must allow access, as installation will fail if the VM cannot access the internet to download the required dependencies.)
6. Depending on the performance of your hardware, allow 10 to 20 minutes for setup complete. Once it finishes, you can browse to *http://localhost:5000* to access the authoring tool. You can then login with the following credentials:

```
 E-mail address: admin
 Password: password
```
At this point you do not need to keep your terminal/command prompt window open. When you want to shut down, just `cd` into the `adapt_authoring` directory again, and run the command `vagrant halt`.  To restart it again later run the `vagrant up` command from the same directory.


## Server Installation

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


#### Node.js and npm

[Node.js](http://nodejs.org/) and [npm](https://www.npmjs.org/) are required. Installing Node.js will also install npm.

**IMPORTANT**: Please ensure that you install Node.js 4.2.x. LTS. This is the long-term supported version that this software has been tested with. 

You should use a Node.js version manager. We recommend using [NVM](https://github.com/creationix/nvm) on non-Windows machines. On Windows, try [nodist](https://github.com/marcelklehr/nodist).

#### Grunt and Adapt Command Line Tools

Install [grunt-cli](http://gruntjs.com/) and [adapt-cli](https://github.com/adaptlearning/adapt-cli) using npm (NOTE the `-g` in both commands is required!):

```
npm install -g grunt-cli
npm install -g adapt-cli
```
Read more about [Grunt](http://gruntjs.com/getting-started).


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

The ouput on the console will tell you what url to use to access the tool. By default it will be *http://localhost:5000*. 

You can run the install script again at anytime. If you chose the same values for the master database connection, you may overwrite any existing data, but this is occasionally desired.

We hope you enjoy using the tool! For help and support, please visit the community page at [http://community.adaptlearning.org](http://community.adaptlearning.org)
