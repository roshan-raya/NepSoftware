CREATE DATABASE IF NOT EXISTS ridesharingapp;
USE ridesharingapp;

-- Table for Users (students and staff of University of Roehampton)
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL CHECK (email LIKE '%@roehampton.ac.uk'),
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Table for User Credentials (login information)
CREATE TABLE UserCredentials (
    user_id INT PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(32) NOT NULL,
    last_password_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    account_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    failed_login_attempts INT DEFAULT 0,
    last_login_attempt TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Table for User Sessions (to track logged-in users)
CREATE TABLE UserSessions (
    session_id VARCHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Table for Rides (ride listings posted by drivers)
CREATE TABLE Rides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    departure_time DATETIME NOT NULL,
    pickup_location VARCHAR(255) NOT NULL,
    seats_available INT NOT NULL CHECK (seats_available >= 0),
    tags VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_driver_id (driver_id)
);

-- Table for Ride Requests (passengers requesting to join rides)
CREATE TABLE Ride_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ride_id INT NOT NULL,
    passenger_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES Rides(id) ON DELETE CASCADE,
    FOREIGN KEY (passenger_id) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_request (ride_id, passenger_id),
    INDEX idx_ride_id (ride_id)
);

-- Insert 15 Users (Roehampton students and staff)
INSERT INTO Users (name, email, profile_photo) VALUES
('Sajan Tamang', 'tam22614816@roehampton.ac.uk', 'sajan.jpg'),
('Himanshu Rana', 'ran22610335@roehampton.ac.uk', 'himanshu.jpg'),
('Roshan Rayamajhi', 'ray22612573@roehampton.ac.uk', 'roshan.jpg'),
('Johnny Chettri', 'chet22610001@roehampton.ac.uk', 'johnny.jpg'),
('Dr. Hansraj Hatti', 'hatti001@roehampton.ac.uk', 'hansraj.jpg'),
('Priya Sharma', 'shar22610002@roehampton.ac.uk', 'priya.jpg'),
('Liam Brown', 'brow22610003@roehampton.ac.uk', 'liam.jpg'),
('Aisha Khan', 'khan22610004@roehampton.ac.uk', 'aisha.jpg'),
('Dr. Emily Watson', 'wats002@roehampton.ac.uk', 'emily.jpg'),
('Omar Hassan', 'hass22610005@roehampton.ac.uk', 'omar.jpg'),
('Sophie Green', 'gree22610006@roehampton.ac.uk', 'sophie.jpg'),
('Prof. James Carter', 'cart003@roehampton.ac.uk', 'james.jpg'),
('Mei Lin', 'lin22610007@roehampton.ac.uk', 'mei.jpg'),
('Lucas Patel', 'pate22610008@roehampton.ac.uk', 'lucas.jpg'),
('Zara Ali', 'ali22610009@roehampton.ac.uk', 'zara.jpg');

-- Insert 15 Rides (various times and locations around Roehampton)
INSERT INTO Rides (driver_id, departure_time, pickup_location, seats_available, tags) VALUES
(1, '2025-03-19 08:00:00', 'Roehampton Lane, SW15 5PJ', 3, 'Early Morning'),
(2, '2025-03-19 17:00:00', 'Barnes Station, SW13 0HT', 2, 'Evening'),
(5, '2025-03-20 13:00:00', 'Kingston Station, KT1 1UJ', 4, 'Afternoon'),
(3, '2025-03-19 09:30:00', 'Putney High Street, SW15 1TW', 2, 'Morning'),
(7, '2025-03-19 18:30:00', 'Richmond Station, TW9 1EZ', 3, 'Evening'),
(9, '2025-03-20 07:45:00', 'Wimbledon Station, SW19 7NL', 1, 'Early Morning'),
(4, '2025-03-19 12:00:00', 'Roehampton University Main Gate', 4, 'Midday'),
(6, '2025-03-20 16:00:00', 'Hammersmith Broadway, W6 9YE', 3, 'Afternoon'),
(8, '2025-03-19 08:15:00', 'East Sheen, SW14 8LS', 2, 'Early Morning'),
(10, '2025-03-20 19:00:00', 'Clapham Junction, SW11 2QP', 3, 'Evening'),
(12, '2025-03-19 10:00:00', 'Fulham Broadway, SW6 1BY', 2, 'Morning'),
(13, '2025-03-20 14:30:00', 'Tooting Broadway, SW17 0SU', 4, 'Afternoon'),
(15, '2025-03-19 07:30:00', 'Southfields Station, SW18 5RL', 1, 'Early Morning'),
(11, '2025-03-20 17:45:00', 'Earlsfield Station, SW18 4SL', 3, 'Evening'),
(14, '2025-03-19 11:15:00', 'Wandsworth Town, SW18 1SU', 2, 'Midday');

-- Insert 15 Ride Requests (various statuses)
INSERT INTO Ride_Requests (ride_id, passenger_id, status) VALUES
(1, 4, 'pending'),   -- Johnny requests Sajan's ride
(2, 3, 'accepted'),  -- Roshan joins Himanshu's ride
(3, 6, 'rejected'),  -- Priya rejected from Dr. Hatti's ride
(4, 8, 'pending'),   -- Aisha requests Johnny's ride
(5, 10, 'accepted'), -- Omar joins Liam's ride
(6, 11, 'pending'),  -- Sophie requests Dr. Watson's ride
(7, 13, 'accepted'), -- Mei joins Priya's ride
(8, 15, 'rejected'), -- Zara rejected from Aisha's ride
(9, 2, 'pending'),   -- Himanshu requests Omar's ride
(10, 5, 'accepted'), -- Dr. Hatti joins Sophie's ride
(11, 7, 'pending'),  -- Liam requests Prof. Carter's ride
(12, 9, 'accepted'), -- Dr. Watson joins Mei's ride
(13, 14, 'rejected'),-- Lucas rejected from Zara's ride
(14, 1, 'pending'),  -- Sajan requests Lucas's ride
(15, 12, 'accepted');-- Prof. Carter joins Roshan's ride