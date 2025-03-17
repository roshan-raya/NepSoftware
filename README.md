# Ride Sharing Application

A web-based ride sharing application built with Node.js, Express, and MySQL.

## Project Overview

This application allows users to share rides to and from the university, helping to reduce transportation costs and environmental impact.

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: MySQL
- **Containerization**: Docker and Docker Compose
- **Database Management**: PHPMyAdmin

## Directory Structure

- `.dockerignore`: Specifies files to exclude from Docker builds
- `.env`: Contains environment variables for database credentials
- `.gitignore`: Defines files to exclude from Git tracking
- `docker-compose.yml`: Configuration for multi-container Docker applications
- `Dockerfile`: Instructions to build a Docker image
- `index.js`: Entry point for the Node.js application
- `package.json`: Defines project dependencies and metadata
- `ridesharingapp.sql`: SQL file to set up the database

### Subdirectories
- `app/`: Contains application logic
  - `app.js`: Core application logic
  - `services/db.js`: Database connection service
- `static/`: Includes static files

## Setup Instructions

### Prerequisites
- Node.js (Windows: https://nodejs.org/en/download/)
- Docker Desktop (Windows: https://docs.docker.com/desktop/windows/install/)
- Docker Compose

### Installation Steps

1. **Clone the repository**

2. **Create .env file**
   Create a `.env` file in the root directory with the following content:
   ```
   MYSQL_HOST=localhost
   MYSQL_USER=admin
   MYSQL_PASS=password
   MYSQL_ROOT_PASSWORD=password
   MYSQL_DATABASE=ridesharingapp
   MYSQL_ROOT_USER=root
   DB_CONTAINER=db
   DB_PORT=3306
   ```

3. **Start the Docker containers**
   ```bash
   npm install
   docker-compose up --build
   ```

4. **Set up the database**
   - The `ridesharingapp` database will be automatically created
   - Access PHPMyAdmin at http://127.0.0.1:8081
   - Login with username=root and password=password
   - Import the `ridesharingapp.sql` file

5. **Verify the setup**
   Visit these endpoints to check if the API is working:
   - http://127.0.0.1:3000/bookings
   - http://127.0.0.1:3000/users
   - http://127.0.0.1:3000/rides

## Development

The application is configured for development with automatic rebuilding when files change. Local files are mounted into the container using the 'volumes' directive in the docker-compose.yml.

### What's Included in the Scaffolding?
- A Docker setup providing Node.js, MySQL, and PHPMyAdmin with proper configuration
- Basic Node.js application file structure
- Package.json with required dependencies
- Database connection setup with MySQL2 package (compatible with MySQL8)
- Environment variable management using dotenv

## Useful Commands

- Get a shell in a container:
  ```bash
  docker exec -it <container name> bash -l
  ```

- Access MySQL CLI:
  ```bash
  mysql -uroot -p<password>
  ```

## Database Connection

The `db.js` file provides the code needed to connect to the MySQL database using the credentials in the `.env` file. It also provides a `query()` function for database interactions.

## References

For reference, see the video at: https://roehampton.cloud.panopto.eu/Panopto/Pages/Viewer.aspx?id=6f290a6b-ba94-4729-9632-adcf00ac336e
