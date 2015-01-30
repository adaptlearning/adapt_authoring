### Windows

The authoring tool is fully tested with version 0.10.33 
Please check your current node version (`node -v`). 

If it is not 0.10.33 then we recommend using a version manager for node.

####nodist - Natural node version manager for windows

[https://github.com/marcelklehr/nodist](https://github.com/marcelklehr/nodist)

(installs latest nodejs+npm on first run.)

1. uninstall existing node installations
    
    >note for windows 8 users:
    >delete nodejs folder because there is no uninstall

2. `git clone git://github.com/marcelklehr/nodist.git` (or grab the [zip](https://github.com/marcelklehr/nodist/zipball/master))  
   (Note that certain paths, e.g. `Program Files`, require admin rights!)

3. `setx /M PATH "path\to\nodist\bin;%PATH%"` ([setx not available?](http://www.computerhope.com/issues/ch000549.htm))

4. `setx /M NODIST_PREFIX "path\to\nodist"`

5. Run `nodist selfupdate` (updates the dependencies and sets npm's global prefix)

6. Run `nodist 0.10.33` (the builder is only fully tested with version 0.10.33)

####node modules

* install `npm install grunt-cli -g`
* install `npm install adapt-cli -g`

####Install FFMPEG
* download a static build from [here](http://ffmpeg.zeranoe.com/builds/)
* unpack it anywhere
* run cmd as administrator
* add it to the system variables `setx /M PATH "path\to\ffmpeg\bin;%PATH%"` 


####Install MongoDB
* download mongodb from [here](http://www.mongodb.org/downloads)
* run the installer
* create mongo data folder in your root (C:\data\db)
* (optional) http://docs.mongodb.org/manual/tutorial/install-mongodb-on-windows/#manually-create-a-windows-service-for-mongodb

If you chose to install mongodb as a service start it with `net start MongoDB`, otherwise

1. run `mongod.exe`
2. run `mongo.exe`

You can now follow the rest of the instructions in the main README.md to clone the project and install the tool.