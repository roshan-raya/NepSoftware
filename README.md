start the ride sharing app in local machine
steps:
!!note: remove *// from the code

#clone the repository of ride sharing app

#create .env file for db in your local machine and paste the code below:
*//
MYSQL_HOST=localhost
MYSQL_USER=admin
MYSQL_PASS=password
MYSQL_ROOT_PASSWORD=password
MYSQL_DATABASE=ridesharingapp.sql
MYSQL_ROOT_USER=root
DB_CONTAINER=db
DB_PORT=3306
*//

#start the docker container:
!!note: nodejs and docker must be configured properly before using this app in local machine.
bash commands to run:
npm install
docker-compose up

#setup the database;
*//

