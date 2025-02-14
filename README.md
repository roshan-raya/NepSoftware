info!!
.dockerignore: Specifies files to exclude from Docker builds.
.env: holds environment variables database credentials.
.gitignore: Defines files to exclude from Git tracking.
docker-compose.yml: Configuration file to define and run multi-container Docker applications.
Dockerfile: Specifies instructions to build a Docker image for the app.
index.js: Entry point for the Node.js application.
package-lock.json and package.json: Define project dependencies and package metadata.
README.md: contains project instructions.
ridesharingapp.sql: SQL file to set up the database.
Subdirectories
app/: Contains application logic.
app.js: Core application logic.
services/db.js: Database service for connecting to the database.
static/: Includes static files (e.g., test.html).

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
MYSQL_DATABASE=ridesharingapp
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
copy the code of ridesharingapp.sql
in 127.0.0.1:8081 php myadmin
with username=root and password=password

to check the validity od database 
visit=http://127.0.0.1:3000/bookings    
    =http://127.0.0.1:3000/users
    =http://127.0.0.1:3000/rides

thank you more to be added soon.......
