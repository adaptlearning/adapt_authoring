# Adapt Core

An authoring library for the [Adapt](https://community.adaptlearning.org/) framework.

## Features

* A complete back end for an Adapt authoring GUI

## Install

The tool currently requires that [MongoDB](http://www.mongodb.org/downloads) be installed and running.

Node version 0.10.2 or above is required. We recommend using [nvm](https://github.com/creationix/nvm) to install and manage node versions:

```
curl https://raw.github.com/creationix/nvm/master/install.sh | sh
```

Use `nvm` to install and alias v.0.10.2:

```
nvm install nvm 0.10.2
nvm alias default 0.10.2
```

You may need to close and reopen your terminal to start using node commands.

Once node has been installed you can use the bundled node package manager to install dependencies automatically:

```
cd path/to/project/
npm install
```

Finally, you should create a config.json file in the conf/ directory. In most cases, simply copying the config-sample.json file will be sufficient.

## Run

To build the codebase prior to launching the site:

```
grunt dev
```


To run the server:

```
node server
```

To run unit tests:

```
make test
```
