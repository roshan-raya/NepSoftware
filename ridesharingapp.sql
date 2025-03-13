

-- Table for Users (students and staff of University of Roehampton)
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL CHECK (email LIKE '%@roehampton.ac.uk'),
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email) -- Index for faster email lookups
);

-- Table for Rides (ride listings posted by drivers)
CREATE TABLE Rides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    departure_time DATETIME NOT NULL,
    pickup_location VARCHAR(255) NOT NULL,
    seats_available INT NOT NULL CHECK (seats_available >= 0),
    tags VARCHAR(100), -- Comma-separated tags (e.g., "Early Morning,Evening")
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_driver_id (driver_id) -- Index for ride lookups by driver
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
    UNIQUE KEY unique_request (ride_id, passenger_id), -- Prevent duplicate requests
    INDEX idx_ride_id (ride_id) -- Index for request lookups by ride
);

-- Insert sample data for testing (aligned with Roehampton context)
INSERT INTO Users (name, email, profile_photo) VALUES
('Sajan Tamang', 'tam22614816@roehampton.ac.uk', 'sajan.jpg'),
('Himanshu Rana', 'ran22610335@roehampton.ac.uk', 'himanshu.jpg'),
('Roshan Rayamajhi', 'ray22612573@roehampton.ac.uk', 'roshan.jpg'),
('Johnny Chettri', 'chet22610001@roehampton.ac.uk', 'johnny.jpg'),
('Dr. Hansraj Hatti', 'hatti001@roehampton.ac.uk', 'hansraj.jpg');

INSERT INTO Rides (driver_id, departure_time, pickup_location, seats_available, tags) VALUES
(1, '2025-03-19 08:00:00', 'Roehampton Lane, SW15 5PJ', 3, 'Early Morning'),
(2, '2025-03-19 17:00:00', 'Barnes Station, SW13 0HT', 2, 'Evening'),
(5, '2025-03-20 13:00:00', 'Kingston Station, KT1 1UJ', 4, 'Afternoon');

INSERT INTO Ride_Requests (ride_id, passenger_id, status) VALUES
(1, 4, 'pending'), -- Johnny requests to join Sajan's ride
(2, 3, 'accepted'); -- Roshan joins Himanshu's ride