# Running Adapt Authoring with Docker

## Requirements

You will need:
* Docker https://docs.docker.com/engine/installation/
* Docker Compose https://docs.docker.com/compose/install/


## Installation

* Run `docker-compose run --rm node npm install`
* Run `docker-compose run --rm node node install`
* During installation, hit enter to select the default option on all questions *except* "Database host" which should be
"moodle"
* Run `docker-compose up -d` (this starts the server)

To find out which port docker has allocated the application, run `docker-compose ps`. You will get output similar to
the output below.

```
         Name                       Command               State            Ports          
-----------------------------------------------------------------------------------------
adaptauthoring_mongo_1   docker-entrypoint.sh mongo ...   Up      27017/tcp               
adaptauthoring_node_1    node server                      Up      0.0.0.0:32769->5000/tcp 
```
The line `0.0.0.0:32769->5000/tcp` indicates that docker has allocated port 32769 to the application.
In this case you can visit the application in a browser by visiting "http://0.0.0.0:32769"

## To view adapt logs
Run `docker-compose logs node`

## To run a command line in the application container
Run `docker-compose exec bash`
