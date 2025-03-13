-- Insert additional users
INSERT INTO users (name, email, password, phone_number) VALUES
('Michael Chen', 'michael@example.com', 'hashedpassword789', '1112223333'),
('Sarah Johnson', 'sarah@example.com', 'hashedpassword101', '4445556666'),
('David Wilson', 'david@example.com', 'hashedpassword102', '7778889999'),
('Emma Brown', 'emma@example.com', 'hashedpassword103', '1231231234'),
('James Taylor', 'james@example.com', 'hashedpassword104', '4564564567'),
('Sophia Garcia', 'sophia@example.com', 'hashedpassword105', '7897897890'),
('Oliver Martinez', 'oliver@example.com', 'hashedpassword106', '3213214321'),
('Isabella Lopez', 'isabella@example.com', 'hashedpassword107', '6546547890'),
('William Lee', 'william@example.com', 'hashedpassword108', '9879879876'),
('Ava Anderson', 'ava@example.com', 'hashedpassword109', '1597534560');

-- Insert additional rides
INSERT INTO rides (driver_id, origin, destination, departure_time, available_seats, price) VALUES
(3, 'Los Angeles', 'San Francisco', '2025-02-16 08:00:00', 4, 75.00),
(4, 'Chicago', 'Detroit', '2025-02-16 09:30:00', 3, 45.00),
(5, 'Seattle', 'Portland', '2025-02-16 11:00:00', 2, 35.00),
(6, 'Miami', 'Orlando', '2025-02-16 13:00:00', 4, 40.00),
(7, 'Houston', 'Austin', '2025-02-16 14:30:00', 3, 30.00),
(8, 'Denver', 'Salt Lake City', '2025-02-16 15:00:00', 2, 55.00),
(9, 'Phoenix', 'Las Vegas', '2025-02-16 16:30:00', 4, 50.00),
(10, 'Washington DC', 'Philadelphia', '2025-02-16 17:00:00', 3, 35.00),
(3, 'San Diego', 'Los Angeles', '2025-02-17 09:00:00', 3, 40.00),
(5, 'Portland', 'Seattle', '2025-02-17 10:30:00', 2, 35.00);

-- Insert additional bookings
INSERT INTO bookings (ride_id, user_id, seats_booked, total_price) VALUES
(2, 4, 2, 150.00),
(2, 5, 1, 75.00),
(3, 6, 2, 90.00),
(4, 7, 1, 35.00),
(5, 8, 2, 80.00),
(6, 9, 1, 30.00),
(7, 10, 2, 110.00),
(8, 3, 1, 50.00),
(9, 4, 2, 70.00),
(10, 5, 1, 35.00);

-- Insert additional tags
INSERT INTO tags (name, description) VALUES
('Night', 'Late night rides between 9pm and 5am'),
('Pet Friendly', 'Allows pets in the vehicle'),
('Luggage Space', 'Extra space for luggage'),
('Student', 'Special rides for students with valid ID'),
('Business', 'Quiet environment for business travelers');

-- Insert additional ride_tags
INSERT INTO ride_tags (ride_id, tag_id) VALUES
(2, 1), -- Morning tag for LA to SF
(2, 3), -- Express tag for LA to SF
(3, 2), -- Afternoon tag for Chicago to Detroit
(3, 5), -- Business tag for Chicago to Detroit
(4, 1), -- Morning tag for Seattle to Portland
(4, 8), -- Pet Friendly tag for Seattle to Portland
(5, 2), -- Afternoon tag for Miami to Orlando
(5, 9), -- Student tag for Miami to Orlando
(6, 2), -- Afternoon tag for Houston to Austin
(6, 7), -- Luggage Space tag for Houston to Austin
(7, 2), -- Afternoon tag for Denver to SLC
(7, 5), -- Business tag for Denver to SLC
(8, 2), -- Afternoon tag for Phoenix to Vegas
(8, 8), -- Pet Friendly tag for Phoenix to Vegas
(9, 1), -- Morning tag for San Diego to LA
(9, 9), -- Student tag for San Diego to LA
(10, 1), -- Morning tag for Portland to Seattle
(10, 7); -- Luggage Space tag for Portland to Seattle 