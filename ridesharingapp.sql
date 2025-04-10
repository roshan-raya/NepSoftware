-- Comprehensive SQL file for RideSharingApp
-- This file includes all database structures and sample data

DROP DATABASE IF EXISTS ridesharingapp;
CREATE DATABASE ridesharingapp;
USE ridesharingapp;

-- Create Users table if it doesn't exist
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(64) NOT NULL,
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    preferred_pickup VARCHAR(255),
    preferred_payment VARCHAR(50) DEFAULT "Cash",
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date DATETIME,
    driver_rating DECIMAL(3,2) DEFAULT 0,
    passenger_rating DECIMAL(3,2) DEFAULT 0,
    bio TEXT,
    phone VARCHAR(20),
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Create Rides table if it doesn't exist
CREATE TABLE IF NOT EXISTS Rides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    departure_time DATETIME NOT NULL,
    pickup_location VARCHAR(255) NOT NULL,
    pickup_lat DECIMAL(10, 8),
    pickup_lng DECIMAL(11, 8),
    destination VARCHAR(255) NOT NULL,
    destination_lat DECIMAL(10, 8),
    destination_lng DECIMAL(11, 8),
    seats_available INT NOT NULL,
    available_seats INT NOT NULL,
    price DECIMAL(10,2),
    notes TEXT,
    tags VARCHAR(255),
    category VARCHAR(50) DEFAULT 'Campus Routes',
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'Available', 'Full', 'Completed_Legacy') DEFAULT 'scheduled',
    preferences VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_departure (departure_time),
    INDEX idx_driver (driver_id),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_pickup_coords (pickup_lat, pickup_lng),
    INDEX idx_dest_coords (destination_lat, destination_lng)
);

-- Create Ride_Requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS Ride_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ride_id INT NOT NULL,
    passenger_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'cancelled') DEFAULT 'pending',
    message TEXT,
    driver_reply TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    reply_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES Rides(id) ON DELETE CASCADE,
    FOREIGN KEY (passenger_id) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_request (ride_id, passenger_id),
    INDEX idx_ride (ride_id),
    INDEX idx_passenger (passenger_id)
);

-- Create Reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS Reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reviewer_id INT NOT NULL,
    reviewee_id INT NOT NULL,
    ride_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    review_type ENUM('driver', 'passenger') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewer_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (ride_id) REFERENCES Rides(id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (reviewer_id, reviewee_id, ride_id, review_type),
    INDEX idx_reviewee (reviewee_id),
    INDEX idx_ride (ride_id)
);

-- Create UserActivity table for tracking user actions
CREATE TABLE IF NOT EXISTS UserActivity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type ENUM('ride_offered', 'ride_joined', 'ride_completed', 'profile_updated', 'review_posted') NOT NULL,
    activity_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type)
);
-- Add columns to Ride_Requests table for payment tracking
ALTER TABLE Ride_Requests 
ADD COLUMN fare DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN payment_status ENUM('pending', 'paid', 'refunded', 'cancelled') DEFAULT NULL;

-- Create Payments table
CREATE TABLE IF NOT EXISTS Payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ride_id INT NOT NULL,
    request_id INT NOT NULL,
    passenger_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('credit_card', 'paypal', 'cash', 'bank_transfer') NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    transaction_id VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES Rides(id) ON DELETE CASCADE,
    FOREIGN KEY (request_id) REFERENCES Ride_Requests(id) ON DELETE CASCADE,
    FOREIGN KEY (passenger_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_ride (ride_id),
    INDEX idx_request (request_id),
    INDEX idx_passenger (passenger_id)
);

-- Create Payment_Methods table for saved payment methods
CREATE TABLE IF NOT EXISTS Payment_Methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    method_type ENUM('credit_card', 'paypal', 'bank_account') NOT NULL,
    details JSON NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
);

-- Create Ride_Pricing table for dynamic pricing rules
CREATE TABLE IF NOT EXISTS Ride_Pricing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    base_fare DECIMAL(10,2) NOT NULL,
    rate_per_km DECIMAL(10,2) NOT NULL,
    min_fare DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GBP',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_category (category)
);

-- Insert default pricing for different ride categories
INSERT INTO Ride_Pricing (category, base_fare, rate_per_km, min_fare)
VALUES
    ('Campus Routes', 2.00, 0.50, 2.00),
    ('Shopping Trips', 3.00, 0.60, 3.00),
    ('Airport Transfers', 10.00, 0.80, 10.00),
    ('Special Events', 5.00, 0.70, 5.00),
    ('Weekend Getaways', 8.00, 0.75, 8.00); 

-- Sample Users data (if needed for development purposes)
INSERT IGNORE INTO Users (id, name, email, password, profile_photo, is_verified) VALUES
(1, 'Admin User', 'admin@roehampton.ac.uk', SHA2('admin123', 256), 'default.jpg', TRUE),
(2, 'Himanshu Kumar', 'himanshu.kumar@roehampton.ac.uk', SHA2('test123', 256), 'default.jpg', TRUE),
(3, 'Roshan Bhatta', 'roshan.bhatta@roehampton.ac.uk', SHA2('test123', 256), 'default.jpg', TRUE),
(4, 'James Smith', 'james.smith@roehampton.ac.uk', SHA2('test123', 256), 'default.jpg', TRUE),
(5, 'Dr. Hatti', 'hatti@roehampton.ac.uk', SHA2('test123', 256), 'default.jpg', TRUE),
(6, 'Emma Wilson', 'emma.wilson@roehampton.ac.uk', SHA2('test123', 256), 'default.jpg', TRUE),
(7, 'Liam Johnson', 'liam.johnson@roehampton.ac.uk', SHA2('test123', 256), 'default.jpg', TRUE),
(8, 'Aisha Khan', 'aisha.khan@roehampton.ac.uk', SHA2('test123', 256), 'default.jpg', FALSE),
(9, 'Daniel Brown', 'daniel.brown@roehampton.ac.uk', SHA2('test123', 256), 'default.jpg', FALSE),
(10, 'Omar Patel', 'omar.patel@roehampton.ac.uk', SHA2('test123', 256), 'default.jpg', FALSE),
(11, 'Sophie Chen', 'sophie.chen@roehampton.ac.uk', SHA2('test123', 256), 'default.jpg', FALSE),
(12, 'Alex Turner', 'alex.turner@roehampton.ac.uk', SHA2('test123', 256), 'default.jpg', FALSE),
(13, 'Mei Wong', 'mei.wong@roehampton.ac.uk', SHA2('test123', 256), 'default.jpg', FALSE),
(14, 'Raj Singh', 'raj.singh@roehampton.ac.uk', SHA2('test123', 256), 'default.jpg', FALSE),
(15, 'Zara Ahmed', 'zara.ahmed@roehampton.ac.uk', SHA2('test123', 256), 'default.jpg', FALSE);

-- Sample Rides data with location coordinates 
INSERT IGNORE INTO Rides (id, driver_id, departure_time, pickup_location, pickup_lat, pickup_lng, destination, destination_lat, destination_lng, seats_available, available_seats, price, notes, tags, status, category, preferences) VALUES
(1, 1, DATE_ADD(NOW(), INTERVAL 1 DAY), 'Roehampton Gate', 51.4554, -0.2642, 'Putney Station', 51.4613, -0.2159, 3, 3, 5.00, 'Regular commute', 'Early Morning', 'Available', 'Campus Routes', 'Quiet Ride'),
(2, 2, DATE_ADD(NOW(), INTERVAL 2 DAY), 'University Main Entrance', 51.4582, -0.2412, 'Richmond', 51.4613, -0.3042, 4, 4, 7.50, 'Going shopping', 'Evening', 'Available', 'Shopping Trips', 'Music Allowed'),
(3, 5, DATE_ADD(NOW(), INTERVAL 3 DAY), 'Library Building', 51.4576, -0.2425, 'Kingston', 51.4096, -0.3060, 2, 2, 10.00, 'Weekend trip', 'Afternoon', 'Available', 'Campus Routes', 'Pet Friendly'),
(4, 3, DATE_ADD(NOW(), INTERVAL 4 DAY), 'Student Union', 51.4573, -0.2428, 'Central London', 51.5074, -0.1278, 3, 3, 12.00, 'Museum visit', 'Morning', 'Available', 'Campus Routes', 'Quiet Ride,Music Allowed'),
(5, 7, DATE_ADD(NOW(), INTERVAL 5 DAY), 'Digby Stuart College', 51.4579, -0.2423, 'Hammersmith', 51.4927, -0.2224, 1, 1, 8.00, 'Concert night', 'Evening', 'Available', 'Shopping Trips', 'Music Allowed'),
(6, 9, DATE_ADD(NOW(), INTERVAL 6 DAY), 'Froebel College', 51.4584, -0.2428, 'Wimbledon', 51.4214, -0.2068, 3, 3, 6.50, 'Tennis match', 'Early Morning', 'Available', 'Campus Routes', 'Quiet Ride'),
(7, 4, DATE_ADD(NOW(), INTERVAL 7 DAY), 'Southlands College', 51.4575, -0.2435, 'Hampton Court', 51.4038, -0.3387, 2, 2, 15.00, 'Palace tour', 'Afternoon', 'Available', 'Campus Routes', 'Music Allowed,Pet Friendly'),
(8, 6, DATE_ADD(NOW(), INTERVAL 8 DAY), 'Whitelands College', 51.4591, -0.2421, 'Kew Gardens', 51.4787, -0.2956, 4, 4, 9.00, 'Botanical trip', 'Midday', 'Available', 'Shopping Trips', ''),
(9, 8, DATE_ADD(NOW(), INTERVAL 9 DAY), 'Main Campus', 51.4582, -0.2412, 'Heathrow Airport', 51.4700, -0.4543, 3, 3, 20.00, 'Airport drop-off', 'Early Morning', 'Available', 'Airport Transfers', 'Quiet Ride'),
(10, 10, DATE_ADD(NOW(), INTERVAL 10 DAY), 'Sports Complex', 51.4594, -0.2406, 'Westfield Shopping Centre', 51.5074, -0.2225, 2, 2, 11.00, 'Shopping day', 'Evening', 'Available', 'Shopping Trips', 'Music Allowed');

-- Sample Ride_Requests data (if needed for development purposes)
INSERT IGNORE INTO Ride_Requests (ride_id, passenger_id, status, message) VALUES
(1, 4, 'accepted', 'I would like to join your ride'),
(1, 3, 'accepted', 'Can I join?'),
(2, 3, 'accepted', 'I need a ride to Richmond'),
(2, 6, 'pending', 'Is there still space available?'),
(3, 6, 'accepted', 'I would like to join your ride to Kingston'),
(3, 8, 'rejected', 'Sorry, no space available'),
(4, 8, 'accepted', 'I need a ride to Central London'),
(4, 10, 'pending', 'Is this ride still available?'),
(5, 10, 'accepted', 'I would like to join your ride to Hammersmith'),
(5, 11, 'accepted', 'Can I join your ride?'),
(6, 11, 'accepted', 'I need a ride to Wimbledon'),
(6, 13, 'pending', 'Is there still space?'),
(7, 13, 'accepted', 'I would like to join your ride to Hampton Court'),
(7, 15, 'rejected', 'Sorry, ride is full'),
(8, 15, 'accepted', 'I need a ride to Kew Gardens'),
(8, 2, 'pending', 'Is this ride still available?'),
(9, 2, 'accepted', 'I would like to join your ride to Heathrow'),
(9, 5, 'accepted', 'Can I join your ride?'),
(10, 5, 'accepted', 'I need a ride to Westfield'),
(10, 4, 'pending', 'Is there still space available?');

-- Sample reviews for drivers
INSERT IGNORE INTO Reviews (reviewer_id, reviewee_id, ride_id, rating, review_text, review_type)
VALUES
(4, 1, 1, 5, 'Great driver! Very punctual and friendly.', 'driver'),
(3, 2, 2, 4, 'Good ride, comfortable car.', 'driver'),
(6, 5, 3, 5, 'Dr. Hatti is an excellent driver, very professional.', 'driver'),
(8, 3, 4, 4, 'On time and courteous.', 'driver'),
(10, 7, 5, 5, 'Liam is a fantastic driver, would ride again!', 'driver'),
(11, 9, 6, 3, 'Decent ride but was a bit late.', 'driver'),
(13, 4, 7, 5, 'Very accommodating driver, helped with my luggage.', 'driver'),
(15, 6, 8, 4, 'Good conversation, made the journey enjoyable.', 'driver'),
(2, 8, 9, 5, 'Excellent ride, very safe driver.', 'driver'),
(5, 10, 10, 4, 'Prompt and efficient.', 'driver');

-- Sample reviews for passengers
INSERT IGNORE INTO Reviews (reviewer_id, reviewee_id, ride_id, rating, review_text, review_type)
VALUES
(1, 4, 1, 5, 'Perfect passenger, right on time and very polite.', 'passenger'),
(2, 3, 2, 5, 'Roshan is a great passenger, would ride with him again!', 'passenger'),
(5, 6, 3, 3, 'Was a little late to the pickup point.', 'passenger'),
(3, 8, 4, 4, 'Aisha was punctual and friendly.', 'passenger'),
(7, 10, 5, 5, 'Omar is an ideal passenger.', 'passenger'),
(9, 11, 6, 4, 'Sophie was ready on time, good conversation.', 'passenger'),
(4, 13, 7, 5, 'Mei is a great passenger, very considerate.', 'passenger'),
(6, 15, 8, 4, 'Good passenger but was a bit noisy.', 'passenger'),
(8, 2, 9, 5, 'Himanshu is an excellent passenger.', 'passenger'),
(10, 5, 10, 5, 'Dr. Hatti is very respectful and punctual.', 'passenger');

-- Sample activity entries
INSERT IGNORE INTO UserActivity (user_id, activity_type, activity_data)
SELECT id, 'profile_updated', JSON_OBJECT('detail', 'Account created') FROM Users;

-- Update user ratings based on reviews
UPDATE Users u
SET driver_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM Reviews
    WHERE reviewee_id = u.id AND review_type = 'driver'
);

UPDATE Users u
SET passenger_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM Reviews
    WHERE reviewee_id = u.id AND review_type = 'passenger'
);

-- Update existing users with some sample preferences
UPDATE Users SET 
preferred_pickup = CASE 
    WHEN id % 3 = 0 THEN 'Roehampton Gate'
    WHEN id % 3 = 1 THEN 'University Main Entrance'
    ELSE 'Library Building'
END,
preferred_payment = CASE 
    WHEN id % 2 = 0 THEN 'Cash'
    ELSE 'Bank Transfer'
END,
verification_date = CASE 
    WHEN is_verified = TRUE THEN DATE_SUB(NOW(), INTERVAL id DAY)
    ELSE NULL
END,
bio = CONCAT('Hi, I am ', name, '. I am a ', CASE WHEN email LIKE '%@roehampton.ac.uk' THEN 'student' ELSE 'staff member' END, ' at University of Roehampton.'),
phone = CONCAT('0', FLOOR(RAND() * 1000000000))
WHERE preferred_pickup IS NULL;