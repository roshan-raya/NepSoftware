-- Create the users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the rides table
CREATE TABLE rides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    departure_time DATETIME NOT NULL,
    available_seats INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create the bookings table
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ride_id INT NOT NULL,
    user_id INT NOT NULL,
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    seats_booked INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create the tags table
CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255)
);

-- Create the ride_tags table for many-to-many relationship
CREATE TABLE ride_tags (
    ride_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (ride_id, tag_id),
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Insert users
INSERT INTO users (name, email, password, phone_number)
VALUES
('John Doe', 'john@example.com', 'hashedpassword123', '1234567890'),
('Jane Smith', 'jane@example.com', 'hashedpassword456', '0987654321');

-- Insert a ride
INSERT INTO rides (driver_id, origin, destination, departure_time, available_seats, price)
VALUES
(1, 'New York', 'Boston', '2025-02-15 10:00:00', 3, 50.00);

-- Insert a booking
INSERT INTO bookings (ride_id, user_id, seats_booked, total_price)
VALUES
(1, 2, 1, 50.00);

-- Insert tags
INSERT INTO tags (name, description)
VALUES
('Morning', 'Early morning rides between 6am and 10am'),
('Afternoon', 'Afternoon rides between 12pm and 4pm'),
('Evening', 'Evening rides between 5pm and 8pm'),
('Weekend', 'Rides on Saturday or Sunday'),
('Express', 'Non-stop rides with no additional pickups');

-- Insert ride_tags
INSERT INTO ride_tags (ride_id, tag_id)
VALUES
(1, 1), -- Morning tag for the New York to Boston ride
(1, 4); -- Weekend tag for the New York to Boston ride
