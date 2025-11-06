-- Flight Reservation System Schema (MySQL)
-- Run this in MySQL Workbench. It will create schema, tables, FKs, indexes,
-- helper functions, stored procedures, triggers, and seed data.

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

-- Seed Data
INSERT INTO Airline (Code, Name) VALUES
('FS', 'FlySwift'),
('SK', 'SkyKing');

INSERT INTO Airport (Name, Location) VALUES
('Indira Gandhi Intl', 'Delhi'),
('Chhatrapati Shivaji Intl', 'Mumbai'),
('Kempegowda Intl', 'Bengaluru');

INSERT INTO Route (Source, Destination) VALUES
('Delhi', 'Mumbai'),
('Mumbai', 'Bengaluru');

INSERT INTO Aircraft (Model, Capacity) VALUES
('Airbus A320', 180),
('Boeing 737', 160);

INSERT INTO Crew (Name, Role) VALUES
('A. Kapoor','Pilot'),('R. Singh','Co-Pilot'),('M. Iyer','Attendant');

INSERT INTO Flight (
  Flight_Number, Airline_ID, Aircraft_ID, Route_ID, Departure_Airport_ID, Arrival_Airport_ID, Date, Time, Base_Fare
) VALUES
('FS101', 1, 1, 1, 1, 2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '09:30:00', 4999.00),
('SK202', 2, 2, 2, 2, 3, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '15:10:00', 3999.00);

-- Note: Default passwords are 'password123' (bcrypt hashed)
-- Password hash for 'password123': $2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS
-- In production, these should be updated or users should register
INSERT INTO Passenger (Name, Email, Phone, Password) VALUES
('Rahul Mehta', 'rahul@example.com', '+91-99999-11111', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS'),
('Sara Khan', 'sara@example.com', '+91-99999-22222', '$2b$10$PowS.9kOWi7Iel24S1CUbeWounkTGSpWavxz1CyaD7XYip9O8/gqS');

-- Assign crew to flights
INSERT INTO Flight_Crew (Flight_ID, Crew_ID) VALUES (1,1),(1,2),(1,3),(2,1),(2,3);

-- Example reservation via procedure (comment to skip)
-- CALL sp_create_reservation(1, 1, 'ECONOMY', '12A', 4999.00, 'CARD', @rid, @tid);
-- SELECT @rid AS Reservation_ID, @tid AS Ticket_ID;


