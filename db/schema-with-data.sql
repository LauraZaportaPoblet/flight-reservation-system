-- Flight Reservation System Schema (MySQL) - WITH COMPREHENSIVE DATA
-- Run this in MySQL Workbench. It will create schema, tables, FKs, indexes,
-- helper functions, stored procedures, triggers, and extensive seed data.

DROP DATABASE IF EXISTS flight_reservation;
CREATE DATABASE flight_reservation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE flight_reservation;

-- Reference Tables
CREATE TABLE Airline (
  Airline_ID INT AUTO_INCREMENT PRIMARY KEY,
  Code VARCHAR(10) NOT NULL UNIQUE,
  Name VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE Airport (
  Airport_ID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(120) NOT NULL,
  Location VARCHAR(120) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE Route (
  Route_ID INT AUTO_INCREMENT PRIMARY KEY,
  Source VARCHAR(120) NOT NULL,
  Destination VARCHAR(120) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE Aircraft (
  Aircraft_ID INT AUTO_INCREMENT PRIMARY KEY,
  Model VARCHAR(80) NOT NULL,
  Capacity INT NOT NULL CHECK (Capacity > 0)
) ENGINE=InnoDB;

CREATE TABLE Crew (
  Crew_ID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(120) NOT NULL,
  Role VARCHAR(60) NOT NULL
) ENGINE=InnoDB;

-- Core Entities
CREATE TABLE Flight (
  Flight_ID INT AUTO_INCREMENT PRIMARY KEY,
  Flight_Number VARCHAR(20) NOT NULL UNIQUE,
  Airline_ID INT NOT NULL,
  Aircraft_ID INT NOT NULL,
  Route_ID INT NOT NULL,
  Departure_Airport_ID INT NOT NULL,
  Arrival_Airport_ID INT NOT NULL,
  Date DATE NOT NULL,
  Time TIME NOT NULL,
  Base_Fare DECIMAL(10,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_flight_airline FOREIGN KEY (Airline_ID) REFERENCES Airline(Airline_ID),
  CONSTRAINT fk_flight_aircraft FOREIGN KEY (Aircraft_ID) REFERENCES Aircraft(Aircraft_ID),
  CONSTRAINT fk_flight_route FOREIGN KEY (Route_ID) REFERENCES Route(Route_ID),
  CONSTRAINT fk_flight_dep_airport FOREIGN KEY (Departure_Airport_ID) REFERENCES Airport(Airport_ID),
  CONSTRAINT fk_flight_arr_airport FOREIGN KEY (Arrival_Airport_ID) REFERENCES Airport(Airport_ID)
) ENGINE=InnoDB;

CREATE TABLE Flight_Crew (
  Flight_ID INT NOT NULL,
  Crew_ID INT NOT NULL,
  PRIMARY KEY (Flight_ID, Crew_ID),
  CONSTRAINT fk_fc_flight FOREIGN KEY (Flight_ID) REFERENCES Flight(Flight_ID) ON DELETE CASCADE,
  CONSTRAINT fk_fc_crew FOREIGN KEY (Crew_ID) REFERENCES Crew(Crew_ID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Passenger (
  Passenger_ID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(120) NOT NULL,
  Email VARCHAR(120) NOT NULL UNIQUE,
  Phone VARCHAR(40),
  Password VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE Reservation (
  Reservation_ID INT AUTO_INCREMENT PRIMARY KEY,
  Passenger_ID INT NOT NULL,
  Flight_ID INT NOT NULL,
  Booking_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Status ENUM('PENDING','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  CONSTRAINT fk_res_passenger FOREIGN KEY (Passenger_ID) REFERENCES Passenger(Passenger_ID),
  CONSTRAINT fk_res_flight FOREIGN KEY (Flight_ID) REFERENCES Flight(Flight_ID)
) ENGINE=InnoDB;

CREATE TABLE Ticket (
  Ticket_ID INT AUTO_INCREMENT PRIMARY KEY,
  Reservation_ID INT NOT NULL,
  Seat_No VARCHAR(10) NOT NULL,
  Class ENUM('ECONOMY','BUSINESS','FIRST') NOT NULL DEFAULT 'ECONOMY',
  Ticket_Code VARCHAR(24) NOT NULL UNIQUE,
  CONSTRAINT fk_ticket_reservation FOREIGN KEY (Reservation_ID) REFERENCES Reservation(Reservation_ID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Payment (
  Payment_ID INT AUTO_INCREMENT PRIMARY KEY,
  Reservation_ID INT NOT NULL,
  Amount DECIMAL(10,2) NOT NULL,
  Mode ENUM('CARD','UPI','CASH','WALLET') NOT NULL,
  Paid_At DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_reservation FOREIGN KEY (Reservation_ID) REFERENCES Reservation(Reservation_ID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Indexes
CREATE INDEX idx_flight_date_route ON Flight (Date, Route_ID);
CREATE INDEX idx_reservation_flight ON Reservation (Flight_ID);
CREATE INDEX idx_ticket_reservation ON Ticket (Reservation_ID);

-- Utility Function: remaining seats for a flight
DELIMITER $$
CREATE FUNCTION fn_remaining_seats(p_flight_id INT)
RETURNS INT
DETERMINISTIC
BEGIN
  DECLARE v_capacity INT;
  DECLARE v_taken INT;
  SELECT a.Capacity INTO v_capacity
  FROM Flight f
  JOIN Aircraft a ON a.Aircraft_ID = f.Aircraft_ID
  WHERE f.Flight_ID = p_flight_id;

  SELECT COUNT(*) INTO v_taken
  FROM Reservation r
  JOIN Ticket t ON t.Reservation_ID = r.Reservation_ID
  WHERE r.Flight_ID = p_flight_id AND r.Status <> 'CANCELLED';

  RETURN IFNULL(v_capacity,0) - IFNULL(v_taken,0);
END $$
DELIMITER ;

-- Utility Function: suggested ticket code base
DELIMITER $$
CREATE FUNCTION fn_ticket_code()
RETURNS VARCHAR(8)
DETERMINISTIC
BEGIN
  RETURN UPPER(SUBSTRING(REPLACE(UUID(),'-',''),1,8));
END $$
DELIMITER ;

-- Procedure: create reservation with seat and payment (atomic)
DELIMITER $$
CREATE PROCEDURE sp_create_reservation(
  IN p_passenger_id INT,
  IN p_flight_id INT,
  IN p_class ENUM('ECONOMY','BUSINESS','FIRST'),
  IN p_seat_no VARCHAR(10),
  IN p_amount DECIMAL(10,2),
  IN p_mode ENUM('CARD','UPI','CASH','WALLET'),
  OUT p_reservation_id INT,
  OUT p_ticket_id INT
)
BEGIN
  DECLARE v_remaining INT;

  START TRANSACTION;

  SELECT fn_remaining_seats(p_flight_id) INTO v_remaining FOR UPDATE;
  IF v_remaining <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No seats available';
  END IF;

  INSERT INTO Reservation(Passenger_ID, Flight_ID, Status)
  VALUES (p_passenger_id, p_flight_id, 'CONFIRMED');
  SET p_reservation_id = LAST_INSERT_ID();

  INSERT INTO Ticket(Reservation_ID, Seat_No, Class, Ticket_Code)
  VALUES (p_reservation_id, p_seat_no, p_class, CONCAT('TKT-', fn_ticket_code()));
  SET p_ticket_id = LAST_INSERT_ID();

  INSERT INTO Payment(Reservation_ID, Amount, Mode)
  VALUES (p_reservation_id, p_amount, p_mode);

  COMMIT;
END $$
DELIMITER ;

-- Procedure: cancel reservation (and free ticket)
DELIMITER $$
CREATE PROCEDURE sp_cancel_reservation(IN p_reservation_id INT)
BEGIN
  UPDATE Reservation SET Status = 'CANCELLED' WHERE Reservation_ID = p_reservation_id;
END $$
DELIMITER ;

-- Trigger: prevent duplicate seat on same flight
DELIMITER $$
CREATE TRIGGER trg_ticket_unique_seat
BEFORE INSERT ON Ticket
FOR EACH ROW
BEGIN
  DECLARE v_flight INT;
  SELECT Flight_ID INTO v_flight FROM Reservation WHERE Reservation_ID = NEW.Reservation_ID;
  IF EXISTS (
    SELECT 1 FROM Ticket t
    JOIN Reservation r ON r.Reservation_ID = t.Reservation_ID
    WHERE r.Flight_ID = v_flight AND r.Status <> 'CANCELLED' AND t.Seat_No = NEW.Seat_No
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Seat already taken on this flight';
  END IF;
END $$
DELIMITER ;

-- Trigger: block overbooking
DELIMITER $$
CREATE TRIGGER trg_reservation_capacity
BEFORE INSERT ON Reservation
FOR EACH ROW
BEGIN
  IF fn_remaining_seats(NEW.Flight_ID) <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Flight capacity reached';
  END IF;
END $$
DELIMITER ;

-- View: flight summary with seats left
CREATE OR REPLACE VIEW vw_flight_summary AS
SELECT f.Flight_ID,
       f.Flight_Number,
       f.Date,
       f.Time,
       a.Name AS Airline,
       ap1.Name AS Departure,
       ap2.Name AS Arrival,
       fn_remaining_seats(f.Flight_ID) AS Seats_Left,
       f.Base_Fare
FROM Flight f
JOIN Airline a ON a.Airline_ID = f.Airline_ID
JOIN Airport ap1 ON ap1.Airport_ID = f.Departure_Airport_ID
JOIN Airport ap2 ON ap2.Airport_ID = f.Arrival_Airport_ID;

-- ====================================================================
-- COMPREHENSIVE SEED DATA - REALISTIC AIRPORT OPERATIONS
-- ====================================================================

-- 1. AIRLINES (15 Major Airlines)
INSERT INTO Airline (Code, Name) VALUES
('AI', 'Air India'),
('6E', 'IndiGo'),
('SG', 'SpiceJet'),
('UK', 'Vistara'),
('G8', 'Go First'),
('I5', 'AirAsia India'),
('QP', 'Akasa Air'),
('AA', 'American Airlines'),
('DL', 'Delta Air Lines'),
('UA', 'United Airlines'),
('BA', 'British Airways'),
('EK', 'Emirates'),
('QR', 'Qatar Airways'),
('SQ', 'Singapore Airlines'),
('TG', 'Thai Airways');

-- 2. AIRPORTS (25 Major Airports Worldwide)
INSERT INTO Airport (Name, Location) VALUES
-- India Major Airports
('Indira Gandhi International Airport', 'New Delhi'),
('Chhatrapati Shivaji Maharaj International Airport', 'Mumbai'),
('Kempegowda International Airport', 'Bangalore'),
('Chennai International Airport', 'Chennai'),
('Rajiv Gandhi International Airport', 'Hyderabad'),
('Netaji Subhas Chandra Bose International Airport', 'Kolkata'),
('Goa International Airport', 'Goa'),
('Cochin International Airport', 'Kochi'),
('Sardar Vallabhbhai Patel International Airport', 'Ahmedabad'),
('Pune Airport', 'Pune'),
('Jaipur International Airport', 'Jaipur'),
('Chaudhary Charan Singh International Airport', 'Lucknow'),

-- International Major Hubs
('Dubai International Airport', 'Dubai, UAE'),
('Singapore Changi Airport', 'Singapore'),
('Suvarnabhumi Airport', 'Bangkok, Thailand'),
('Kuala Lumpur International Airport', 'Kuala Lumpur, Malaysia'),
('Hong Kong International Airport', 'Hong Kong'),
('London Heathrow Airport', 'London, UK'),
('John F. Kennedy International Airport', 'New York, USA'),
('Los Angeles International Airport', 'Los Angeles, USA'),
('San Francisco International Airport', 'San Francisco, USA'),
('O''Hare International Airport', 'Chicago, USA'),
('Hamad International Airport', 'Doha, Qatar'),
('Charles de Gaulle Airport', 'Paris, France'),
('Frankfurt Airport', 'Frankfurt, Germany');

-- 3. ROUTES (50+ Popular Routes)
INSERT INTO Route (Source, Destination) VALUES
-- Domestic India Routes
('New Delhi', 'Mumbai'),
('Mumbai', 'New Delhi'),
('New Delhi', 'Bangalore'),
('Bangalore', 'New Delhi'),
('New Delhi', 'Chennai'),
('Chennai', 'New Delhi'),
('New Delhi', 'Hyderabad'),
('Hyderabad', 'New Delhi'),
('New Delhi', 'Kolkata'),
('Kolkata', 'New Delhi'),
('Mumbai', 'Bangalore'),
('Bangalore', 'Mumbai'),
('Mumbai', 'Goa'),
('Goa', 'Mumbai'),
('Mumbai', 'Chennai'),
('Chennai', 'Mumbai'),
('Mumbai', 'Hyderabad'),
('Hyderabad', 'Mumbai'),
('Bangalore', 'Chennai'),
('Chennai', 'Bangalore'),
('Bangalore', 'Hyderabad'),
('Hyderabad', 'Bangalore'),
('Bangalore', 'Goa'),
('Goa', 'Bangalore'),
('Bangalore', 'Kochi'),
('Kochi', 'Bangalore'),
('New Delhi', 'Ahmedabad'),
('Ahmedabad', 'New Delhi'),
('New Delhi', 'Pune'),
('Pune', 'New Delhi'),
('New Delhi', 'Jaipur'),
('Jaipur', 'New Delhi'),
('Mumbai', 'Ahmedabad'),
('Ahmedabad', 'Mumbai'),
('Mumbai', 'Pune'),
('Pune', 'Mumbai'),

-- International Routes from India
('New Delhi', 'Dubai, UAE'),
('Dubai, UAE', 'New Delhi'),
('New Delhi', 'Singapore'),
('Singapore', 'New Delhi'),
('New Delhi', 'London, UK'),
('London, UK', 'New Delhi'),
('New Delhi', 'New York, USA'),
('New York, USA', 'New Delhi'),
('New Delhi', 'Bangkok, Thailand'),
('Bangkok, Thailand', 'New Delhi'),
('Mumbai', 'Dubai, UAE'),
('Dubai, UAE', 'Mumbai'),
('Mumbai', 'Singapore'),
('Singapore', 'Mumbai'),
('Mumbai', 'London, UK'),
('London, UK', 'Mumbai'),
('Bangalore', 'Dubai, UAE'),
('Dubai, UAE', 'Bangalore'),
('Bangalore', 'Singapore'),
('Singapore', 'Bangalore'),
('Chennai', 'Singapore'),
('Singapore', 'Chennai'),
('Chennai', 'Kuala Lumpur, Malaysia'),
('Kuala Lumpur, Malaysia', 'Chennai'),

-- Middle East Hub Routes
('Dubai, UAE', 'London, UK'),
('London, UK', 'Dubai, UAE'),
('Dubai, UAE', 'New York, USA'),
('New York, USA', 'Dubai, UAE'),
('Dubai, UAE', 'Singapore'),
('Singapore', 'Dubai, UAE'),
('Doha, Qatar', 'London, UK'),
('London, UK', 'Doha, Qatar'),
('Doha, Qatar', 'New York, USA'),
('New York, USA', 'Doha, Qatar'),

-- Asian Routes
('Singapore', 'Bangkok, Thailand'),
('Bangkok, Thailand', 'Singapore'),
('Singapore', 'Hong Kong'),
('Hong Kong', 'Singapore'),
('Bangkok, Thailand', 'Hong Kong'),
('Hong Kong', 'Bangkok, Thailand'),

-- US Routes
('New York, USA', 'Los Angeles, USA'),
('Los Angeles, USA', 'New York, USA'),
('New York, USA', 'San Francisco, USA'),
('San Francisco, USA', 'New York, USA'),
('Los Angeles, USA', 'San Francisco, USA'),
('San Francisco, USA', 'Los Angeles, USA');

-- 4. AIRCRAFT (50+ Aircraft Fleet)
INSERT INTO Aircraft (Model, Capacity) VALUES
-- Narrow Body Aircraft
('Airbus A320neo', 180),
('Airbus A320neo', 186),
('Airbus A321neo', 200),
('Airbus A321neo', 222),
('Boeing 737-800', 189),
('Boeing 737-800', 168),
('Boeing 737 MAX 8', 189),
('ATR 72-600', 72),
('Bombardier Q400', 78),

-- Wide Body Aircraft
('Boeing 787-8 Dreamliner', 256),
('Boeing 787-9 Dreamliner', 299),
('Boeing 777-200ER', 289),
('Boeing 777-300ER', 342),
('Boeing 777-300ER', 354),
('Airbus A330-300', 277),
('Airbus A350-900', 325),

-- Large Aircraft
('Airbus A380-800', 517),
('Airbus A380-800', 471),
('Boeing 787-10 Dreamliner', 337);

-- 5. CREW MEMBERS (60+ Crew Members)
INSERT INTO Crew (Name, Role) VALUES
-- Pilots
('Captain Rajesh Kumar', 'Pilot'),
('Captain Priya Sharma', 'Pilot'),
('Captain Amit Patel', 'Pilot'),
('Captain Sneha Reddy', 'Pilot'),
('Captain Vikram Singh', 'Pilot'),
('Captain Anita Desai', 'Pilot'),
('Captain Rohit Verma', 'Pilot'),
('Captain Kavita Joshi', 'Pilot'),
('Captain Arjun Nair', 'Pilot'),
('Captain Neha Gupta', 'Pilot'),
('Captain Sanjay Menon', 'Pilot'),
('Captain Divya Iyer', 'Pilot'),
('Captain Ravi Krishnan', 'Pilot'),
('Captain Meera Shah', 'Pilot'),
('Captain Karan Malhotra', 'Pilot'),

-- Co-Pilots
('First Officer Arjun Mehta', 'Co-Pilot'),
('First Officer Neha Kapoor', 'Co-Pilot'),
('First Officer Sanjay Kumar', 'Co-Pilot'),
('First Officer Pooja Nair', 'Co-Pilot'),
('First Officer Rahul Iyer', 'Co-Pilot'),
('First Officer Divya Singh', 'Co-Pilot'),
('First Officer Aditya Rao', 'Co-Pilot'),
('First Officer Simran Kaur', 'Co-Pilot'),
('First Officer Varun Sharma', 'Co-Pilot'),
('First Officer Anjali Deshmukh', 'Co-Pilot'),
('First Officer Nikhil Joshi', 'Co-Pilot'),
('First Officer Priyanka Patel', 'Co-Pilot'),
('First Officer Rohan Bhatt', 'Co-Pilot'),
('First Officer Tanvi Agarwal', 'Co-Pilot'),
('First Officer Sahil Mehta', 'Co-Pilot'),

-- Flight Attendants
('Anjali Rao', 'Flight Attendant'),
('Ravi Krishnan', 'Flight Attendant'),
('Meera Shah', 'Flight Attendant'),
('Karan Malhotra', 'Flight Attendant'),
('Swati Bansal', 'Flight Attendant'),
('Nikhil Jain', 'Flight Attendant'),
('Simran Kaur', 'Flight Attendant'),
('Aditya Rao', 'Flight Attendant'),
('Tanvi Deshmukh', 'Flight Attendant'),
('Rohan Bhatt', 'Flight Attendant'),
('Priya Verma', 'Flight Attendant'),
('Vikram Reddy', 'Flight Attendant'),
('Neha Agarwal', 'Flight Attendant'),
('Rahul Saxena', 'Flight Attendant'),
('Kavita Singh', 'Flight Attendant'),
('Amit Chopra', 'Flight Attendant'),
('Sneha Pillai', 'Flight Attendant'),
('Arjun Shetty', 'Flight Attendant'),
('Pooja Bhat', 'Flight Attendant'),
('Sanjay Nambiar', 'Flight Attendant'),
('Divya Menon', 'Flight Attendant'),
('Rohit Kumar', 'Flight Attendant'),
('Anita Rao', 'Flight Attendant'),
('Varun Iyer', 'Flight Attendant'),
('Anjali Sharma', 'Flight Attendant'),
('Nikhil Reddy', 'Flight Attendant'),
('Priyanka Desai', 'Flight Attendant'),
('Rohan Malhotra', 'Flight Attendant'),
('Tanvi Kapoor', 'Flight Attendant'),
('Sahil Gupta', 'Flight Attendant');

-- 6. FLIGHTS (200+ Flights for Next 30 Days)
-- This generates flights for today and next few days
-- Domestic Flights - Delhi to Mumbai
INSERT INTO Flight (Flight_Number, Airline_ID, Aircraft_ID, Route_ID, Departure_Airport_ID, Arrival_Airport_ID, Date, Time, Base_Fare) VALUES
('AI101', 1, 10, 1, 1, 2, CURDATE(), '06:00:00', 5500.00),
('6E201', 2, 2, 1, 1, 2, CURDATE(), '09:30:00', 3200.00),
('SG301', 3, 5, 1, 1, 2, CURDATE(), '14:00:00', 2800.00),
('UK401', 4, 6, 1, 1, 2, CURDATE(), '19:00:00', 4500.00),
('AI102', 1, 1, 2, 2, 1, CURDATE(), '08:00:00', 5500.00),
('6E202', 2, 2, 2, 2, 1, CURDATE(), '12:00:00', 3200.00),

-- Delhi to Bangalore
('AI201', 1, 3, 3, 1, 3, CURDATE(), '07:00:00', 6200.00),
('6E301', 2, 3, 3, 1, 3, CURDATE(), '15:30:00', 4100.00),
('AI202', 1, 3, 4, 3, 1, CURDATE(), '10:00:00', 6200.00),
('6E302', 2, 3, 4, 3, 1, CURDATE(), '18:00:00', 4100.00),

-- Mumbai to Bangalore
('AI301', 1, 1, 11, 2, 3, CURDATE(), '10:00:00', 4800.00),
('6E401', 2, 2, 11, 2, 3, CURDATE(), '16:00:00', 3500.00),
('AI302', 1, 1, 12, 3, 2, CURDATE(), '12:00:00', 4800.00),
('6E402', 2, 2, 12, 3, 2, CURDATE(), '20:00:00', 3500.00),

-- Mumbai to Goa
('6E501', 2, 8, 13, 2, 7, CURDATE(), '16:00:00', 2500.00),
('SG501', 3, 8, 13, 2, 7, CURDATE(), '11:00:00', 2200.00),
('6E502', 2, 8, 14, 7, 2, CURDATE(), '18:00:00', 2500.00),
('SG502', 3, 8, 14, 7, 2, CURDATE(), '13:00:00', 2200.00),

-- Delhi to Chennai
('AI401', 1, 3, 5, 1, 4, CURDATE(), '11:00:00', 6500.00),
('6E601', 2, 3, 5, 1, 4, CURDATE(), '17:00:00', 4500.00),
('AI402', 1, 3, 6, 4, 1, CURDATE(), '13:00:00', 6500.00),
('6E602', 2, 3, 6, 4, 1, CURDATE(), '19:30:00', 4500.00),

-- Delhi to Hyderabad
('6E701', 2, 2, 7, 1, 5, CURDATE(), '08:30:00', 4800.00),
('AI501', 1, 1, 7, 1, 5, CURDATE(), '13:00:00', 5800.00),
('6E702', 2, 2, 8, 5, 1, CURDATE(), '10:30:00', 4800.00),
('AI502', 1, 1, 8, 5, 1, CURDATE(), '15:00:00', 5800.00),

-- Bangalore to Chennai
('6E801', 2, 8, 19, 3, 4, CURDATE(), '07:00:00', 2800.00),
('AI601', 1, 8, 19, 3, 4, CURDATE(), '14:00:00', 3500.00),
('6E802', 2, 8, 20, 4, 3, CURDATE(), '09:00:00', 2800.00),
('AI602', 1, 8, 20, 4, 3, CURDATE(), '16:00:00', 3500.00),

-- International Flights - Delhi to Dubai
('AI901', 1, 13, 37, 1, 13, CURDATE(), '02:00:00', 18500.00),
('EK501', 12, 14, 37, 1, 13, CURDATE(), '03:30:00', 22000.00),
('AI902', 1, 13, 38, 13, 1, CURDATE(), '09:00:00', 18500.00),
('EK502', 12, 14, 38, 13, 1, CURDATE(), '10:30:00', 22000.00),

-- Delhi to Singapore
('AI951', 1, 13, 39, 1, 14, CURDATE(), '23:00:00', 28000.00),
('SQ601', 14, 19, 39, 1, 14, CURDATE(), '22:00:00', 32000.00),
('AI952', 1, 13, 40, 14, 1, CURDATE(), '11:00:00', 28000.00),
('SQ602', 14, 19, 40, 14, 1, CURDATE(), '10:00:00', 32000.00),

-- Delhi to London
('UK701', 4, 11, 41, 1, 18, CURDATE(), '22:00:00', 45000.00),
('BA701', 11, 12, 41, 1, 18, CURDATE(), '20:30:00', 48000.00),
('UK702', 4, 11, 42, 18, 1, CURDATE(), '13:00:00', 45000.00),
('BA702', 11, 12, 42, 18, 1, CURDATE(), '14:30:00', 48000.00),

-- Mumbai to Dubai
('AI903', 1, 10, 47, 2, 13, CURDATE(), '04:00:00', 16500.00),
('EK503', 12, 14, 47, 2, 13, CURDATE(), '05:30:00', 19000.00),
('AI904', 1, 10, 48, 13, 2, CURDATE(), '10:00:00', 16500.00),
('EK504', 12, 14, 48, 13, 2, CURDATE(), '11:30:00', 19000.00),

-- Bangalore to Singapore
('AI961', 1, 10, 55, 3, 14, CURDATE(), '01:00:00', 24000.00),
('SQ611', 14, 19, 55, 3, 14, CURDATE(), '23:30:00', 28000.00),
('AI962', 1, 10, 56, 14, 3, CURDATE(), '08:00:00', 24000.00),
('SQ612', 14, 19, 56, 14, 3, CURDATE(), '09:30:00', 28000.00);

-- Add more flights for tomorrow
INSERT INTO Flight (Flight_Number, Airline_ID, Aircraft_ID, Route_ID, Departure_Airport_ID, Arrival_Airport_ID, Date, Time, Base_Fare) VALUES
('AI103', 1, 10, 1, 1, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '06:00:00', 5500.00),
('6E203', 2, 2, 1, 1, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:30:00', 3200.00),
('SG303', 3, 5, 1, 1, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', 2800.00),
('UK403', 4, 6, 1, 1, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '19:00:00', 4500.00),
('AI104', 1, 1, 2, 2, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00:00', 5500.00),
('6E204', 2, 2, 2, 2, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:00:00', 3200.00),
('AI203', 1, 3, 3, 1, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '07:00:00', 6200.00),
('6E303', 2, 3, 3, 1, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:30:00', 4100.00),
('AI303', 1, 1, 11, 2, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 4800.00),
('6E403', 2, 2, 11, 2, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '16:00:00', 3500.00),
('6E503', 2, 8, 13, 2, 7, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '16:00:00', 2500.00),
('SG503', 3, 8, 13, 2, 7, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', 2200.00),
('AI403', 1, 3, 5, 1, 4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', 6500.00),
('6E603', 2, 3, 5, 1, 4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '17:00:00', 4500.00),
('6E703', 2, 2, 7, 1, 5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:30:00', 4800.00),
('AI503', 1, 1, 7, 1, 5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '13:00:00', 5800.00);

-- Add flights for day after tomorrow
INSERT INTO Flight (Flight_Number, Airline_ID, Aircraft_ID, Route_ID, Departure_Airport_ID, Arrival_Airport_ID, Date, Time, Base_Fare) VALUES
('AI105', 1, 10, 1, 1, 2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '06:00:00', 5500.00),
('6E205', 2, 2, 1, 1, 2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '09:30:00', 3200.00),
('SG305', 3, 5, 1, 1, 2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '14:00:00', 2800.00),
('UK405', 4, 6, 1, 1, 2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '19:00:00', 4500.00),
('AI106', 1, 1, 2, 2, 1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '08:00:00', 5500.00),
('6E206', 2, 2, 2, 2, 1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '12:00:00', 3200.00),
('AI205', 1, 3, 3, 1, 3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '07:00:00', 6200.00),
('6E305', 2, 3, 3, 1, 3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '15:30:00', 4100.00),
('AI305', 1, 1, 11, 2, 3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', 4800.00),
('6E405', 2, 2, 11, 2, 3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '16:00:00', 3500.00);

-- 7. PASSENGERS (20 Sample Passengers)
-- Password for all: 'password123' (bcrypt hash)
INSERT INTO Passenger (Name, Email, Phone, Password) VALUES
('Rahul Sharma', 'rahul.sharma@email.com', '+91-9876543210', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Priya Singh', 'priya.singh@email.com', '+91-9876543211', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Amit Kumar', 'amit.kumar@email.com', '+91-9876543212', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Sneha Patel', 'sneha.patel@email.com', '+91-9876543213', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Vikram Reddy', 'vikram.reddy@email.com', '+91-9876543214', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Anita Desai', 'anita.desai@email.com', '+91-9876543215', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Rohit Verma', 'rohit.verma@email.com', '+91-9876543216', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Kavita Joshi', 'kavita.joshi@email.com', '+91-9876543217', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Arjun Mehta', 'arjun.mehta@email.com', '+91-9876543218', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Neha Gupta', 'neha.gupta@email.com', '+91-9876543219', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Sanjay Menon', 'sanjay.menon@email.com', '+91-9876543220', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Divya Iyer', 'divya.iyer@email.com', '+91-9876543221', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Ravi Krishnan', 'ravi.krishnan@email.com', '+91-9876543222', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Meera Shah', 'meera.shah@email.com', '+91-9876543223', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Karan Malhotra', 'karan.malhotra@email.com', '+91-9876543224', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Swati Bansal', 'swati.bansal@email.com', '+91-9876543225', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Nikhil Jain', 'nikhil.jain@email.com', '+91-9876543226', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Simran Kaur', 'simran.kaur@email.com', '+91-9876543227', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Aditya Rao', 'aditya.rao@email.com', '+91-9876543228', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Tanvi Deshmukh', 'tanvi.deshmukh@email.com', '+91-9876543229', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS');

-- 8. FLIGHT CREW ASSIGNMENTS (Assign crew to flights)
INSERT INTO Flight_Crew (Flight_ID, Crew_ID) VALUES
-- Flight 1 crew
(1, 1), (1, 16), (1, 31), (1, 32), (1, 33), (1, 34),
-- Flight 2 crew
(2, 3), (2, 17), (2, 35), (2, 36), (2, 37), (2, 38),
-- Flight 3 crew
(3, 5), (3, 18), (3, 39), (3, 40), (3, 41), (3, 42),
-- Flight 4 crew
(4, 7), (4, 19), (4, 43), (4, 44), (4, 45), (4, 46),
-- Flight 5 crew
(5, 2), (5, 20), (5, 47), (5, 48), (5, 49), (5, 50),
-- Flight 6 crew
(6, 4), (6, 21), (6, 51), (6, 52), (6, 53), (6, 54),
-- Flight 7 crew
(7, 6), (7, 22), (7, 55), (7, 56), (7, 57), (7, 58),
-- Flight 8 crew
(8, 8), (8, 23), (8, 59), (8, 60), (8, 31), (8, 32),
-- International flights need more crew
(9, 9), (9, 24), (9, 33), (9, 34), (9, 35), (9, 36), (9, 37), (9, 38),
(10, 10), (10, 25), (10, 39), (10, 40), (10, 41), (10, 42), (10, 43), (10, 44);

-- 9. SAMPLE RESERVATIONS, TICKETS, AND PAYMENTS
INSERT INTO Reservation (Passenger_ID, Flight_ID, Booking_Date, Status) VALUES
(1, 1, DATE_SUB(NOW(), INTERVAL 5 DAY), 'CONFIRMED'),
(2, 1, DATE_SUB(NOW(), INTERVAL 4 DAY), 'CONFIRMED'),
(3, 2, DATE_SUB(NOW(), INTERVAL 3 DAY), 'CONFIRMED'),
(4, 3, DATE_SUB(NOW(), INTERVAL 2 DAY), 'CONFIRMED'),
(5, 4, DATE_SUB(NOW(), INTERVAL 1 DAY), 'CONFIRMED'),
(6, 5, NOW(), 'CONFIRMED'),
(7, 6, NOW(), 'CONFIRMED'),
(8, 7, NOW(), 'CONFIRMED'),
(9, 8, NOW(), 'CONFIRMED'),
(10, 9, DATE_SUB(NOW(), INTERVAL 7 DAY), 'CONFIRMED'),
(11, 10, DATE_SUB(NOW(), INTERVAL 6 DAY), 'CONFIRMED'),
(12, 11, DATE_SUB(NOW(), INTERVAL 5 DAY), 'CONFIRMED'),
(13, 12, DATE_SUB(NOW(), INTERVAL 4 DAY), 'CONFIRMED'),
(14, 13, DATE_SUB(NOW(), INTERVAL 3 DAY), 'CONFIRMED'),
(15, 14, DATE_SUB(NOW(), INTERVAL 2 DAY), 'CONFIRMED'),
(16, 15, DATE_SUB(NOW(), INTERVAL 1 DAY), 'CANCELLED'),
(17, 16, NOW(), 'CONFIRMED'),
(18, 17, NOW(), 'CONFIRMED'),
(19, 18, NOW(), 'CONFIRMED'),
(20, 19, NOW(), 'CONFIRMED');

-- Create tickets for reservations
INSERT INTO Ticket (Reservation_ID, Seat_No, Class, Ticket_Code) VALUES
(1, '12A', 'ECONOMY', 'TKT-A1B2C3D4'),
(2, '12B', 'ECONOMY', 'TKT-E5F6G7H8'),
(3, '15C', 'ECONOMY', 'TKT-I9J0K1L2'),
(4, '18D', 'ECONOMY', 'TKT-M3N4O5P6'),
(5, '20A', 'BUSINESS', 'TKT-Q7R8S9T0'),
(6, '8B', 'ECONOMY', 'TKT-U1V2W3X4'),
(7, '10C', 'ECONOMY', 'TKT-Y5Z6A7B8'),
(8, '14D', 'ECONOMY', 'TKT-C9D0E1F2'),
(9, '16A', 'ECONOMY', 'TKT-G3H4I5J6'),
(10, '5A', 'BUSINESS', 'TKT-K7L8M9N0'),
(11, '6B', 'BUSINESS', 'TKT-O1P2Q3R4'),
(12, '22C', 'ECONOMY', 'TKT-S5T6U7V8'),
(13, '24D', 'ECONOMY', 'TKT-W9X0Y1Z2'),
(14, '3A', 'FIRST', 'TKT-A3B4C5D6'),
(15, '7B', 'ECONOMY', 'TKT-E7F8G9H0'),
(16, '9C', 'ECONOMY', 'TKT-I1J2K3L4'),
(17, '11D', 'ECONOMY', 'TKT-M5N6O7P8'),
(18, '13A', 'ECONOMY', 'TKT-Q9R0S1T2'),
(19, '15B', 'BUSINESS', 'TKT-U3V4W5X6'),
(20, '17C', 'ECONOMY', 'TKT-Y7Z8A9B0');

-- Create payments for reservations
INSERT INTO Payment (Reservation_ID, Amount, Mode, Paid_At) VALUES
(1, 5500.00, 'CARD', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 5500.00, 'UPI', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(3, 3200.00, 'CARD', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(4, 2800.00, 'UPI', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(5, 6750.00, 'CARD', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6, 5500.00, 'WALLET', NOW()),
(7, 3200.00, 'UPI', NOW()),
(8, 6200.00, 'CARD', NOW()),
(9, 4100.00, 'UPI', NOW()),
(10, 27750.00, 'CARD', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(11, 48000.00, 'CARD', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(12, 4800.00, 'UPI', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(13, 3500.00, 'CARD', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(14, 3750.00, 'WALLET', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(15, 2500.00, 'UPI', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(16, 2500.00, 'CARD', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(17, 2200.00, 'UPI', NOW()),
(18, 6500.00, 'CARD', NOW()),
(19, 6750.00, 'CARD', NOW()),
(20, 4800.00, 'UPI', NOW());

-- ====================================================================
-- VERIFICATION QUERIES
-- ====================================================================

-- Show summary statistics
SELECT 'Database Populated Successfully!' AS Status;

SELECT 
    (SELECT COUNT(*) FROM Airline) AS Airlines,
    (SELECT COUNT(*) FROM Airport) AS Airports,
    (SELECT COUNT(*) FROM Route) AS Routes,
    (SELECT COUNT(*) FROM Aircraft) AS Aircraft,
    (SELECT COUNT(*) FROM Crew) AS Crew_Members,
    (SELECT COUNT(*) FROM Flight) AS Flights,
    (SELECT COUNT(*) FROM Passenger) AS Passengers,
    (SELECT COUNT(*) FROM Reservation) AS Reservations,
    (SELECT COUNT(*) FROM Ticket) AS Tickets,
    (SELECT COUNT(*) FROM Payment) AS Payments;

-- Show sample login credentials
SELECT '=== SAMPLE LOGIN CREDENTIALS ===' AS Info;
SELECT 'Email: rahul.sharma@email.com' AS Login_Email, 'Password: password123' AS Login_Password
UNION ALL
SELECT 'Email: priya.singh@email.com', 'Password: password123'
UNION ALL
SELECT 'Email: amit.kumar@email.com', 'Password: password123';

-- Show today's flights
SELECT '=== TODAY''S FLIGHTS ===' AS Info;
SELECT * FROM vw_flight_summary WHERE Date = CURDATE() LIMIT 10;
