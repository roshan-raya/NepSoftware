
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
create a new ridesharingapp database
copy the code of ridesharingapp.sql
in 127.0.0.1:8081 php myadmin
with username=root and password=password

to check the validity od database 
visit=http://127.0.0.1:3000/bookings    
    =http://127.0.0.1:3000/users
    =http://127.0.0.1:3000/rides

thank you more to be added soon.......
=======
MySQL, PHPMyAdmin and Node.js (ready for Express development)
This will install Mysql and phpmyadmin (including all dependencies to run Phpmyadmin) AND node.js

This receipe is for development - Node.js is run in using supervisor: changes to any file in the app will trigger a rebuild automatically.

For security, this receipe uses a .env file for credentials. A sample is provided in the env-sample file. If using these files for a fresh project, copy the env-sample file to a file called .env. Do NOT commit the changed .env file into your new project for security reasons (in the node package its included in .gitignore so you can't anyway)

In node.js, we use the MySQl2 packages (to avoid problems with MySQL8) and the dotenv package to read the environment variables.

Local files are mounted into the container using the 'volumes' directive in the docker-compose.yml for ease of development.

Super-quickstart your new project:
Make sure that you don't have any other containers running usind docker ps
run docker-compose up --build
Visit phphmyadmin at:
http://localhost:8081/

Visit your express app at:
http://localhost:3000

For reference, see the video at: https://roehampton.cloud.panopto.eu/Panopto/Pages/Viewer.aspx?id=6f290a6b-ba94-4729-9632-adcf00ac336e

NB if you are running this on your own computer rather than the azure labs that has been set up for you, you will need to install the following:

node.js (windows: https://nodejs.org/en/download/)
docker desktop (for windows, this will also prompt you to install linux subsystem for windows https://docs.docker.com/desktop/windows/install/ )
Whats provided in these scaffolding files?
A docker setup which will provide you with node.js, mysql and phpmyadmin, including the configuration needed so that both node.js AND phpmyadmin can 'see' and connect to your mysql database. If you don't use docker you'll have to set up and connect each of these components separately.
A basic starting file structure for a node.js app.
A package.json file that will pull in the node.js libraries required and start your app as needed.
A db.js file which provides all the code needed to connect to the mysql database, using the credentials in the .env file, and which provides a query() function that can send queries to the database and receive a result. In order to use this (ie. interact with the database, you simply need to include this file in any file you create that needs this database interaction) with the following code:
Useful commands:

Get a shell in any of the containers

docker exec -it <container name> bash -l
Once in the database container, you can get a MySQL CLI in the usual way

mysql -uroot -p<password> 
this is ride sharing app   
>>>>>>> origin/main
