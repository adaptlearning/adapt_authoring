## Introduction
* The Adapt authoring tool is a node app that provides a user interface for the Adapt framework.
* This version of instructions contains only the essential details. [A more detailed set of installation instructions is also available.](https://github.com/adaptlearning/adapt_authoring/wiki/Install-on-Server) If you need assistance troubleshooting, consult the Adapt community's <a href="https://community.adaptlearning.org/mod/forum/view.php?id=4" target="_blank">Technical Discussion Forum</a>.

### Navigation
- [Installing Manually](#to-install-manually)
- [Updating the tool](#updating-the-tool)

## To Install Manually

### 1. Install Prerequisites

Install the following before proceeding:
* [Git](http://git-scm.com/downloads)
* [Node](http://nodejs.org/) Use Node.js v4.2.x. Node version managers, such as [nodist (Windows)](https://github.com/marcelklehr/nodist) or [nvm (OS X, Linux)]  (https://github.com/creationix/nvm), make it easy to switch between versions of Node.
* [npm](https://www.npmjs.com/) is bundled and installed automatically with Node.
* [Grunt](http://gruntjs.com/)
* [Adapt-CLI](https://github.com/adaptlearning/adapt-cli)
* [MongoDB](http://docs.mongodb.org/manual/)

The following are optional:
* [FFmpeg](https://www.ffmpeg.org/index.html) is used to provide thumbnails for image and video assets.
* [Robomongo](http://robomongo.org/) is not used by the authoring tool, but you might find it helpful in your work with MongoDB.

> **Tips:**
> + Windows users should run these commands in Git Bash if Git was installed using default settings. Otherwise, run the command prompt window as Administrator.
> + Mac and Linux users may need to prefix the commands with `sudo` or give yourself elevated permissions on the */usr/local directory* as documented [here](http://foohack.com/2010/08/intro-to-npm/#what_no_sudo).

### 2. Clone the Adapt_Authoring Project

`git clone https://github.com/adaptlearning/adapt_authoring.git`


### 3. Install Dependencies
Navigate to the folder where you cloned adapt_authoring and run the following command:
`npm install`

### 4. Run the Install Script

The final portion of the install script will help you configure the authoring tool. Most configuration questions will appear with a default answer already in place. And most times you can just accept the default values by pressing the Enter key. **The only input you are required to provide are an email address and password for the super user account.** (The questions about the super user account is not the same as the SMTP service or the master tenant.) The super user's email address and password will be used to login to the authoring tool.
>**Notes:**
>* FFmpeg is not used by default. When the question "Will ffmpeg be used?" N for no will appear as the default. If FFmpeg is installed and you want to use it, type Y before pressing the Enter key.
>* In the future the authoring tool will be able to send notifications via e-mail. Configuration questions will ask about SMTP service, SMTP username, SMTP password, and Sender email address. Because this is not yet functioning, your responses have no impact. Accept the default of "none" for the SMTP service and leave the others blank.
>* It is essential that you verify that the MongoDB service has started and is running. Installation will fail if the MongoDB service has stopped.

Run the following command.
`node install`

If the script succeeds, you'll receive the following message:
`Done, without errors.`
And you'll be instructed to
`Run the command 'node server' (or 'foreman start' if using heroku toolbelt) to start your instance.`

### 5. Run the Application
1. Verify MongoDB service is running.

2. Run the following command.
`node server`
As the server starts, it will report in the terminal:
`Server started listening on port 5000`
If your server is listening on a different port, take note of it.

3. Open a browser and in the address bar type:
`localhost:5000` (If your server is listening on a different port, substitute your port for 5000.)

When the login page appears, **enter the super user's e-mail address and password.**

## Updating the tool

We've written a Node.js script to allow you to easily update both the authoring tool core and the installed Adapt framework to the latest versions.

**IMPORTANT**: 
- Before upgrading, make sure to first remove the `node_modules` folder and re-install the dependencies to ensure that you get the correct package dependencies for the updated code.
- Also please consult the [CHANGELOG](https://github.com/adaptlearning/adapt_authoring/blob/update-changelog/CHANGELOG.md) for the release you're upgrading to; any extra upgrade instructions will be noted here.

```javascript
npm install --production
node upgrade
```

The upgrade script will ask for confirmation before proceeding. Once you've consented, the process will begin.
