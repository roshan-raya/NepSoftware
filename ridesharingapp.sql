CREATE DATABASE IF NOT EXISTS ridesharingapp;
USE ridesharingapp;

-- Table for Users (students and staff of University of Roehampton)
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL CHECK (email LIKE '%@roehampton.ac.uk'),
    password VARCHAR(255) NOT NULL,
    profile_photo VARCHAR(255),
    user_type ENUM('student', 'staff', 'admin') DEFAULT 'student',
    is_smoker BOOLEAN DEFAULT FALSE,
    is_driver BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Table for User Preferences
CREATE TABLE User_Preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    non_smoking_preference BOOLEAN DEFAULT TRUE,
    music_preference ENUM('none', 'low', 'medium', 'high') DEFAULT 'medium',
    chat_preference ENUM('quiet', 'casual', 'chatty') DEFAULT 'casual',
    student_only_preference BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Table for Rides (ride listings posted by drivers )
CREATE TABLE Rides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    departure_time DATETIME NOT NULL,
    pickup_location VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL DEFAULT 'University of Roehampton',
    seats_available INT NOT NULL CHECK (seats_available >= 0),
    price_per_seat DECIMAL(6,2) DEFAULT 0.00,
    smoking_allowed BOOLEAN DEFAULT FALSE,
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

-- Table for Messages
CREATE TABLE Messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    ride_id INT,
    message_text TEXT NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (ride_id) REFERENCES Rides(id) ON DELETE SET NULL,
    INDEX idx_sender_receiver (sender_id, receiver_id),
    INDEX idx_ride_id (ride_id)
);

-- Table for Ratings
CREATE TABLE Ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ride_id INT NOT NULL,
    rater_id INT NOT NULL,
    rated_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES Rides(id) ON DELETE CASCADE,
    FOREIGN KEY (rater_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (rated_id) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_rating (ride_id, rater_id, rated_id),
    INDEX idx_rated_id (rated_id)
);

-- Insert 15 Users (Roehampton students and staff) with hashed passwords (password: 'password123')
INSERT INTO Users (name, email, password, profile_photo, user_type, is_smoker, is_driver) VALUES
('Sajan Tamang', 'tam22614816@roehampton.ac.uk', '$2a$10$6jBGLAMeAyiLNxI1RZrCZuu9QRt3QnvgfMD5Ne3h8QkxpQrSMSi.q', 'sajan.jpg', 'student', FALSE, TRUE),
('Himanshu Rana', 'ran22610335@roehampton.ac.uk', '$2a$10$6jBGLAMeAyiLNxI1RZrCZuu9QRt3QnvgfMD5Ne3h8QkxpQrSMSi.q', 'himanshu.jpg', 'student', TRUE, TRUE),
('Roshan Rayamajhi', 'ray22612573@roehampton.ac.uk', '$2a$10$6jBGLAMeAyiLNxI1RZrCZuu9QRt3QnvgfMD5Ne3h8QkxpQrSMSi.q', 'roshan.jpg', 'student', FALSE, TRUE),
('Johnny Chettri', 'chet22610001@roehampton.ac.uk', '$2a$10$6jBGLAMeAyiLNxI1RZrCZuu9QRt3QnvgfMD5Ne3h8QkxpQrSMSi.q', 'johnny.jpg', 'student', FALSE, FALSE),
('Dr. Hansraj Hatti', 'hatti001@roehampton.ac.uk', '$2a$10$6jBGLAMeAyiLNxI1RZrCZuu9QRt3QnvgfMD5Ne3h8QkxpQrSMSi.q', 'hansraj.jpg', 'staff', FALSE, TRUE),
('Priya Sharma', 'shar22610002@roehampton.ac.uk', '$2a$10$6jBGLAMeAyiLNxI1RZrCZuu9QRt3QnvgfMD5Ne3h8QkxpQrSMSi.q', 'priya.jpg', 'student', FALSE, FALSE),
('Liam Brown', 'brow22610003@roehampton.ac.uk', '$2a$10$6jBGLAMeAyiLNxI1RZrCZuu9QRt3QnvgfMD5Ne3h8QkxpQrSMSi.q', 'liam.jpg', 'student', TRUE, TRUE),
('Aisha Khan', 'khan22610004@roehampton.ac.uk', '$2a$10$6jBGLAMeAyiLNxI1RZrCZuu9QRt3QnvgfMD5Ne3h8QkxpQrSMSi.q', 'aisha.jpg', 'student', FALSE, FALSE),
('Dr. Emily Watson', 'wats002@roehampton.ac.uk', '$2a$10$6jBGLAMeAyiLNxI1RZrCZuu9QRt3QnvgfMD5Ne3h8QkxpQrSMSi.q', 'emily.jpg', 'staff', FALSE, TRUE),
('Omar Hassan', 'hass22610005@roehampton.ac.uk', '$2a$10$6jBGLAMeAyiLNxI1RZrCZuu9QRt3QnvgfMD5Ne3h8QkxpQrSMSi.q', 'omar.jpg', 'student', TRUE, FALSE),
('Sophie Green', 'gree22610006@roehampton.ac.uk', '$2a$10$6jBGLAMeAyiLNxI1RZrCZuu9QRt3QnvgfMD5Ne3h8QkxpQrSMSi.q', 'sophie.jpg', 'student', FALSE, TRUE),
('Prof. James Carter', 'cart003@roehampton.ac.uk', '$2a$10$6jBGLAMeAyiLNxI1RZrCZuu9QRt3QnvgfMD5Ne3h8QkxpQrSMSi.q', 'james.jpg', 'staff', FALSE, TRUE),
('Mei Lin', 'lin22610007@roehampton.ac.uk', '$2a$10$6jBGLAMeAyiLNxI1RZrCZuu9QRt3QnvgfMD5Ne3h8QkxpQrSMSi.q', 'mei.jpg', 'student', FALSE, TRUE),
('Lucas Patel', 'pate22610008@roehampton.ac.uk', '$2a$10$6jBGLAMeAyiLNxI1RZrCZuu9QRt3QnvgfMD5Ne3h8QkxpQrSMSi.q', 'lucas.jpg', 'student', TRUE, TRUE),
('Zara Ali', 'ali22610009@roehampton.ac.uk', '$2a$10$6jBGLAMeAyiLNxI1RZrCZuu9QRt3QnvgfMD5Ne3h8QkxpQrSMSi.q', 'zara.jpg', 'student', FALSE, TRUE);

-- Insert user preferences
INSERT INTO User_Preferences (user_id, non_smoking_preference, music_preference, chat_preference, student_only_preference) VALUES
(1, TRUE, 'medium', 'casual', FALSE),
(2, FALSE, 'high', 'chatty', FALSE),
(3, TRUE, 'low', 'quiet', TRUE),
(4, TRUE, 'medium', 'casual', TRUE),
(5, TRUE, 'low', 'casual', FALSE),
(6, TRUE, 'medium', 'casual', TRUE),
(7, FALSE, 'high', 'chatty', FALSE),
(8, TRUE, 'low', 'quiet', TRUE),
(9, TRUE, 'medium', 'casual', FALSE),
(10, FALSE, 'high', 'chatty', FALSE),
(11, TRUE, 'medium', 'casual', TRUE),
(12, TRUE, 'low', 'quiet', FALSE),
(13, TRUE, 'medium', 'casual', TRUE),
(14, FALSE, 'high', 'chatty', FALSE),
(15, TRUE, 'medium', 'casual', TRUE);

-- Insert 15 Rides (various times and locations around Roehampton)
INSERT INTO Rides (driver_id, departure_time, pickup_location, destination, seats_available, price_per_seat, smoking_allowed, tags) VALUES
(1, '2025-03-19 08:00:00', 'Roehampton Lane, SW15 5PJ', 'University of Roehampton', 3, 2.50, FALSE, 'Early Morning'),
(2, '2025-03-19 17:00:00', 'Barnes Station, SW13 0HT', 'University of Roehampton', 2, 3.00, TRUE, 'Evening'),
(5, '2025-03-20 13:00:00', 'Kingston Station, KT1 1UJ', 'University of Roehampton', 4, 4.00, FALSE, 'Afternoon'),
(3, '2025-03-19 09:30:00', 'Putney High Street, SW15 1TW', 'University of Roehampton', 2, 2.00, FALSE, 'Morning'),
(7, '2025-03-19 18:30:00', 'Richmond Station, TW9 1EZ', 'University of Roehampton', 3, 3.50, TRUE, 'Evening'),
(9, '2025-03-20 07:45:00', 'Wimbledon Station, SW19 7NL', 'University of Roehampton', 1, 4.50, FALSE, 'Early Morning'),
(4, '2025-03-19 12:00:00', 'Roehampton University Main Gate', 'Kingston Town Centre', 4, 3.00, FALSE, 'Midday'),
(6, '2025-03-20 16:00:00', 'Hammersmith Broadway, W6 9YE', 'University of Roehampton', 3, 5.00, FALSE, 'Afternoon'),
(8, '2025-03-19 08:15:00', 'East Sheen, SW14 8LS', 'University of Roehampton', 2, 2.50, FALSE, 'Early Morning'),
(10, '2025-03-20 19:00:00', 'Clapham Junction, SW11 2QP', 'University of Roehampton', 3, 4.00, TRUE, 'Evening'),
(12, '2025-03-19 10:00:00', 'Fulham Broadway, SW6 1BY', 'University of Roehampton', 2, 3.50, FALSE, 'Morning'),
(13, '2025-03-20 14:30:00', 'Tooting Broadway, SW17 0SU', 'University of Roehampton', 4, 4.00, FALSE, 'Afternoon'),
(15, '2025-03-19 07:30:00', 'Southfields Station, SW18 5RL', 'University of Roehampton', 1, 2.00, FALSE, 'Early Morning'),
(11, '2025-03-20 17:45:00', 'Earlsfield Station, SW18 4SL', 'University of Roehampton', 3, 3.00, FALSE, 'Evening'),
(14, '2025-03-19 11:15:00', 'Wandsworth Town, SW18 1SU', 'University of Roehampton', 2, 2.50, TRUE, 'Midday');

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

-- Insert initial ratings
INSERT INTO Ratings (ride_id, rater_id, rated_id, rating, comment) VALUES
(2, 3, 2, 5, 'Great driver, very punctual!'),
(5, 10, 7, 4, 'Pleasant journey, good music'),
(7, 13, 4, 3, 'Okay ride, car was a bit messy'),
(10, 5, 11, 5, 'Very comfortable ride and friendly driver'),
(12, 9, 13, 4, 'On time and safe driving'),
(15, 12, 3, 5, 'Excellent conversation and smooth ride');

-- Insert some initial messages
INSERT INTO Messages (sender_id, receiver_id, ride_id, message_text, read_status) VALUES
(1, 4, 1, 'Hi Johnny, I saw your ride request. Where exactly should I pick you up?', FALSE),
(3, 2, 2, 'Thanks for accepting my request! Can I bring a small backpack?', TRUE),
(2, 3, 2, 'Yes, that\'s no problem. See you at the pickup point tomorrow.', FALSE),
(6, 5, 3, 'Hello Dr. Hatti, may I ask why my request was rejected?', TRUE),
(5, 6, 3, 'Sorry Priya, I already promised the last seat to a colleague.', TRUE),
(7, 10, 5, 'We\'re still good for 6:30pm at Richmond Station?', FALSE),
(10, 7, 5, 'Yes, I\'ll be there on time!', TRUE),
(9, 11, 6, 'I\'ll be in a blue Toyota. Look for me near the station entrance.', FALSE),
(13, 4, 7, 'I\'m running about 5 minutes late. Please wait for me.', TRUE),
(4, 13, 7, 'No problem, I\'ll wait.', TRUE);