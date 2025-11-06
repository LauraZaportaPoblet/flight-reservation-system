import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Kavya@20',
  database: process.env.DB_NAME || 'flight_reservation',
  waitForConnections: true,
  connectionLimit: 10,
});

async function populateDatabase() {
  try {
    console.log('🚀 Starting database population...\n');

    // 1. AIRLINES
    console.log('✈️ Adding Airlines...');
    const airlines = [
      ['AI', 'Air India', 'India', '+91-1800-180-1407'],
      ['6E', 'IndiGo', 'India', '+91-9910-383-838'],
      ['SG', 'SpiceJet', 'India', '+91-987-180-3333'],
      ['UK', 'Vistara', 'India', '+91-9289-228-228'],
      ['G8', 'Go First', 'India', '+91-022-6152-6700'],
      ['I5', 'AirAsia India', 'India', '+91-80-4666-2222'],
      ['QP', 'Akasa Air', 'India', '+91-893-047-0001'],
      ['AA', 'American Airlines', 'USA', '+1-800-433-7300'],
      ['DL', 'Delta Air Lines', 'USA', '+1-800-221-1212'],
      ['UA', 'United Airlines', 'USA', '+1-800-864-8331'],
      ['BA', 'British Airways', 'UK', '+44-344-493-0787'],
      ['EK', 'Emirates', 'UAE', '+971-4-214-4444'],
      ['QR', 'Qatar Airways', 'Qatar', '+974-4023-0000'],
      ['SQ', 'Singapore Airlines', 'Singapore', '+65-6223-8888'],
      ['TG', 'Thai Airways', 'Thailand', '+66-2-356-1111']
    ];

    for (const airline of airlines) {
      await pool.query(
        'INSERT IGNORE INTO Airline (Airline_Code, Airline_Name, Country, Contact_Info) VALUES (?, ?, ?, ?)',
        airline
      );
    }
    console.log(`✅ Added ${airlines.length} airlines\n`);

    // 2. AIRPORTS
    console.log('🏢 Adding Airports...');
    const airports = [
      // India - Major Airports
      ['DEL', 'Indira Gandhi International Airport', 'New Delhi', 'India', 'Asia/Kolkata'],
      ['BOM', 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai', 'India', 'Asia/Kolkata'],
      ['BLR', 'Kempegowda International Airport', 'Bangalore', 'India', 'Asia/Kolkata'],
      ['MAA', 'Chennai International Airport', 'Chennai', 'India', 'Asia/Kolkata'],
      ['HYD', 'Rajiv Gandhi International Airport', 'Hyderabad', 'India', 'Asia/Kolkata'],
      ['CCU', 'Netaji Subhas Chandra Bose International Airport', 'Kolkata', 'India', 'Asia/Kolkata'],
      ['GOI', 'Goa International Airport', 'Goa', 'India', 'Asia/Kolkata'],
      ['COK', 'Cochin International Airport', 'Kochi', 'India', 'Asia/Kolkata'],
      ['AMD', 'Sardar Vallabhbhai Patel International Airport', 'Ahmedabad', 'India', 'Asia/Kolkata'],
      ['PNQ', 'Pune Airport', 'Pune', 'India', 'Asia/Kolkata'],
      ['JAI', 'Jaipur International Airport', 'Jaipur', 'India', 'Asia/Kolkata'],
      ['LKO', 'Chaudhary Charan Singh International Airport', 'Lucknow', 'India', 'Asia/Kolkata'],
      
      // International - Major Hubs
      ['DXB', 'Dubai International Airport', 'Dubai', 'UAE', 'Asia/Dubai'],
      ['SIN', 'Singapore Changi Airport', 'Singapore', 'Singapore', 'Asia/Singapore'],
      ['BKK', 'Suvarnabhumi Airport', 'Bangkok', 'Thailand', 'Asia/Bangkok'],
      ['KUL', 'Kuala Lumpur International Airport', 'Kuala Lumpur', 'Malaysia', 'Asia/Kuala_Lumpur'],
      ['HKG', 'Hong Kong International Airport', 'Hong Kong', 'China', 'Asia/Hong_Kong'],
      ['LHR', 'London Heathrow Airport', 'London', 'UK', 'Europe/London'],
      ['JFK', 'John F. Kennedy International Airport', 'New York', 'USA', 'America/New_York'],
      ['LAX', 'Los Angeles International Airport', 'Los Angeles', 'USA', 'America/Los_Angeles'],
      ['SFO', 'San Francisco International Airport', 'San Francisco', 'USA', 'America/Los_Angeles'],
      ['ORD', 'O\'Hare International Airport', 'Chicago', 'USA', 'America/Chicago'],
      ['DOH', 'Hamad International Airport', 'Doha', 'Qatar', 'Asia/Qatar'],
      ['CDG', 'Charles de Gaulle Airport', 'Paris', 'France', 'Europe/Paris'],
      ['FRA', 'Frankfurt Airport', 'Frankfurt', 'Germany', 'Europe/Berlin']
    ];

    for (const airport of airports) {
      await pool.query(
        'INSERT IGNORE INTO Airport (Airport_Code, Airport_Name, City, Country, Timezone) VALUES (?, ?, ?, ?, ?)',
        airport
      );
    }
    console.log(`✅ Added ${airports.length} airports\n`);

    // 3. AIRCRAFT
    console.log('🛫 Adding Aircraft...');
    const aircraft = [
      // Air India Fleet
      ['VT-ANL', 'Boeing 787-8', 'AI', 256, '2018-03-15'],
      ['VT-ANM', 'Boeing 787-8', 'AI', 256, '2018-05-20'],
      ['VT-ANN', 'Airbus A320neo', 'AI', 180, '2019-07-10'],
      ['VT-ANO', 'Airbus A321neo', 'AI', 200, '2019-09-15'],
      ['VT-ANP', 'Boeing 777-300ER', 'AI', 342, '2015-11-20'],
      
      // IndiGo Fleet
      ['VT-IGA', 'Airbus A320neo', '6E', 186, '2020-01-15'],
      ['VT-IGB', 'Airbus A320neo', '6E', 186, '2020-02-20'],
      ['VT-IGC', 'Airbus A321neo', '6E', 222, '2020-03-10'],
      ['VT-IGD', 'ATR 72-600', '6E', 72, '2019-12-05'],
      ['VT-IGE', 'Airbus A320neo', '6E', 186, '2020-04-25'],
      ['VT-IGF', 'Airbus A321neo', '6E', 222, '2020-05-30'],
      
      // SpiceJet Fleet
      ['VT-SGA', 'Boeing 737-800', 'SG', 189, '2017-06-12'],
      ['VT-SGB', 'Boeing 737 MAX 8', 'SG', 189, '2019-01-20'],
      ['VT-SGC', 'Bombardier Q400', 'SG', 78, '2018-03-15'],
      ['VT-SGD', 'Boeing 737-800', 'SG', 189, '2017-08-10'],
      
      // Vistara Fleet
      ['VT-TNA', 'Boeing 787-9', 'UK', 299, '2020-02-15'],
      ['VT-TNB', 'Airbus A321neo', 'UK', 188, '2019-11-20'],
      ['VT-TNC', 'Airbus A320neo', 'UK', 158, '2019-09-10'],
      ['VT-TND', 'Boeing 737-800', 'UK', 168, '2018-07-05'],
      
      // Emirates Fleet
      ['A6-EUA', 'Airbus A380-800', 'EK', 517, '2016-05-10'],
      ['A6-EUB', 'Boeing 777-300ER', 'EK', 354, '2017-08-20'],
      ['A6-EUC', 'Boeing 777-300ER', 'EK', 354, '2017-10-15'],
      
      // Singapore Airlines
      ['9V-SKA', 'Airbus A380-800', 'SQ', 471, '2015-12-20'],
      ['9V-SKB', 'Boeing 787-10', 'SQ', 337, '2019-04-15'],
      
      // American Airlines
      ['N123AA', 'Boeing 777-200ER', 'AA', 289, '2016-03-10'],
      ['N124AA', 'Airbus A321neo', 'AA', 196, '2019-07-20']
    ];

    for (const plane of aircraft) {
      await pool.query(
        'INSERT IGNORE INTO Aircraft (Registration_No, Model, Airline_Code, Capacity, Manufacture_Date) VALUES (?, ?, ?, ?, ?)',
        plane
      );
    }
    console.log(`✅ Added ${aircraft.length} aircraft\n`);

    // 4. ROUTES
    console.log('🗺️ Adding Routes...');
    const routes = [
      // Domestic Indian Routes
      ['DEL', 'BOM', 1140],
      ['DEL', 'BLR', 1740],
      ['DEL', 'MAA', 1760],
      ['DEL', 'HYD', 1240],
      ['DEL', 'CCU', 1320],
      ['DEL', 'GOI', 1520],
      ['BOM', 'BLR', 840],
      ['BOM', 'GOI', 440],
      ['BOM', 'MAA', 1030],
      ['BOM', 'HYD', 620],
      ['BOM', 'CCU', 1650],
      ['BLR', 'MAA', 290],
      ['BLR', 'HYD', 500],
      ['BLR', 'GOI', 420],
      ['BLR', 'COK', 270],
      ['MAA', 'HYD', 510],
      ['DEL', 'AMD', 760],
      ['DEL', 'PNQ', 1160],
      ['DEL', 'JAI', 240],
      ['BOM', 'AMD', 440],
      ['BOM', 'PNQ', 120],
      
      // International Routes from India
      ['DEL', 'DXB', 2190],
      ['DEL', 'SIN', 4130],
      ['DEL', 'LHR', 6700],
      ['DEL', 'JFK', 11760],
      ['DEL', 'BKK', 2960],
      ['BOM', 'DXB', 1930],
      ['BOM', 'SIN', 4060],
      ['BOM', 'LHR', 7200],
      ['BLR', 'DXB', 2680],
      ['BLR', 'SIN', 3270],
      ['MAA', 'SIN', 2840],
      ['MAA', 'KUL', 2590],
      
      // Middle East Hub Routes
      ['DXB', 'LHR', 5470],
      ['DXB', 'JFK', 11010],
      ['DXB', 'SIN', 5960],
      ['DOH', 'LHR', 5140],
      ['DOH', 'JFK', 10740],
      
      // Asian Routes
      ['SIN', 'BKK', 1430],
      ['SIN', 'HKG', 2590],
      ['BKK', 'HKG', 1680],
      
      // US Routes
      ['JFK', 'LAX', 3950],
      ['JFK', 'SFO', 4140],
      ['LAX', 'SFO', 540]
    ];

    for (const route of routes) {
      await pool.query(
        'INSERT IGNORE INTO Route (Origin, Destination, Distance_km) VALUES (?, ?, ?)',
        route
      );
    }
    console.log(`✅ Added ${routes.length} routes\n`);

    // 5. FLIGHTS
    console.log('✈️ Adding Flights...');
    const flights = [];
    const today = new Date();
    
    // Generate flights for next 30 days
    for (let day = 0; day < 30; day++) {
      const flightDate = new Date(today);
      flightDate.setDate(today.getDate() + day);
      const dateStr = flightDate.toISOString().split('T')[0];
      
      // Popular domestic routes
      flights.push(['AI101', 'VT-ANL', 'DEL', 'BOM', dateStr, '06:00:00', '08:15:00', 'SCHEDULED', 5500]);
      flights.push(['6E201', 'VT-IGA', 'DEL', 'BOM', dateStr, '09:30:00', '11:45:00', 'SCHEDULED', 3200]);
      flights.push(['SG301', 'VT-SGA', 'DEL', 'BOM', dateStr, '14:00:00', '16:15:00', 'SCHEDULED', 2800]);
      flights.push(['UK401', 'VT-TNC', 'DEL', 'BOM', dateStr, '19:00:00', '21:15:00', 'SCHEDULED', 4500]);
      
      flights.push(['AI102', 'VT-ANN', 'BOM', 'DEL', dateStr, '08:00:00', '10:15:00', 'SCHEDULED', 5500]);
      flights.push(['6E202', 'VT-IGB', 'BOM', 'DEL', dateStr, '12:00:00', '14:15:00', 'SCHEDULED', 3200]);
      
      flights.push(['AI201', 'VT-ANO', 'DEL', 'BLR', dateStr, '07:00:00', '09:45:00', 'SCHEDULED', 6200]);
      flights.push(['6E301', 'VT-IGC', 'DEL', 'BLR', dateStr, '15:30:00', '18:15:00', 'SCHEDULED', 4100]);
      
      flights.push(['AI301', 'VT-ANN', 'BOM', 'BLR', dateStr, '10:00:00', '11:30:00', 'SCHEDULED', 4800]);
      flights.push(['6E401', 'VT-IGA', 'BOM', 'GOI', dateStr, '16:00:00', '17:15:00', 'SCHEDULED', 2500]);
      
      flights.push(['AI401', 'VT-ANM', 'DEL', 'MAA', dateStr, '11:00:00', '13:45:00', 'SCHEDULED', 6500]);
      flights.push(['6E501', 'VT-IGE', 'DEL', 'HYD', dateStr, '08:30:00', '10:45:00', 'SCHEDULED', 4800]);
      
      // International flights (less frequent - only 3 times a week)
      if (day % 3 === 0) {
        flights.push(['AI501', 'VT-ANP', 'DEL', 'DXB', dateStr, '02:00:00', '04:30:00', 'SCHEDULED', 18500]);
        flights.push(['EK501', 'A6-EUB', 'DXB', 'DEL', dateStr, '09:00:00', '14:30:00', 'SCHEDULED', 22000]);
        flights.push(['AI601', 'VT-ANP', 'DEL', 'SIN', dateStr, '23:00:00', '06:30:00', 'SCHEDULED', 28000]);
        flights.push(['SQ601', '9V-SKB', 'SIN', 'DEL', dateStr, '11:00:00', '14:30:00', 'SCHEDULED', 32000]);
        flights.push(['UK701', 'VT-TNA', 'DEL', 'LHR', dateStr, '22:00:00', '04:30:00', 'SCHEDULED', 45000]);
        flights.push(['BA701', 'N123AA', 'LHR', 'DEL', dateStr, '13:00:00', '02:30:00', 'SCHEDULED', 48000]);
      }
    }

    for (const flight of flights) {
      await pool.query(
        'INSERT IGNORE INTO Flight (Flight_Number, Registration_No, Origin, Destination, Date, Time, Arrival_Time, Status, Price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        flight
      );
    }
    console.log(`✅ Added ${flights.length} flights\n`);

    // 6. CREW MEMBERS
    console.log('👥 Adding Crew Members...');
    const crew = [
      // Pilots
      ['Rajesh Kumar', 'PILOT', 'AI', 150000, '2010-05-15'],
      ['Priya Sharma', 'PILOT', 'AI', 145000, '2012-08-20'],
      ['Amit Patel', 'PILOT', '6E', 135000, '2015-03-10'],
      ['Sneha Reddy', 'PILOT', '6E', 140000, '2014-11-25'],
      ['Vikram Singh', 'PILOT', 'SG', 130000, '2016-07-18'],
      ['Anita Desai', 'PILOT', 'UK', 148000, '2013-09-05'],
      ['Rohit Verma', 'PILOT', 'UK', 142000, '2015-01-20'],
      ['Kavita Joshi', 'PILOT', '6E', 138000, '2016-04-12'],
      
      // Co-Pilots
      ['Arjun Mehta', 'CO-PILOT', 'AI', 95000, '2018-06-15'],
      ['Neha Gupta', 'CO-PILOT', 'AI', 92000, '2019-02-20'],
      ['Sanjay Kumar', 'CO-PILOT', '6E', 88000, '2019-08-10'],
      ['Pooja Nair', 'CO-PILOT', '6E', 90000, '2018-12-05'],
      ['Rahul Iyer', 'CO-PILOT', 'SG', 85000, '2020-03-15'],
      ['Divya Singh', 'CO-PILOT', 'UK', 93000, '2019-07-22'],
      
      // Flight Attendants
      ['Anjali Rao', 'FLIGHT_ATTENDANT', 'AI', 45000, '2017-05-10'],
      ['Ravi Krishnan', 'FLIGHT_ATTENDANT', 'AI', 43000, '2018-08-15'],
      ['Meera Shah', 'FLIGHT_ATTENDANT', '6E', 42000, '2019-01-20'],
      ['Karan Malhotra', 'FLIGHT_ATTENDANT', '6E', 44000, '2018-11-12'],
      ['Swati Bansal', 'FLIGHT_ATTENDANT', 'SG', 41000, '2019-06-18'],
      ['Nikhil Jain', 'FLIGHT_ATTENDANT', 'UK', 46000, '2018-03-25'],
      ['Simran Kaur', 'FLIGHT_ATTENDANT', '6E', 43500, '2019-09-08'],
      ['Aditya Rao', 'FLIGHT_ATTENDANT', 'AI', 44500, '2018-07-14'],
      ['Tanvi Deshmukh', 'FLIGHT_ATTENDANT', 'SG', 42500, '2019-04-20'],
      ['Rohan Bhatt', 'FLIGHT_ATTENDANT', 'UK', 45500, '2018-10-30']
    ];

    for (const member of crew) {
      await pool.query(
        'INSERT INTO Crew (Name, Role, Airline_Code, Salary, Hire_Date) VALUES (?, ?, ?, ?, ?)',
        member
      );
    }
    console.log(`✅ Added ${crew.length} crew members\n`);

    // 7. SAMPLE PASSENGERS
    console.log('👤 Adding Sample Passengers...');
    const passengers = [
      ['Rahul Sharma', 'rahul.sharma@email.com', '+91-9876543210', await bcrypt.hash('password123', 10)],
      ['Priya Singh', 'priya.singh@email.com', '+91-9876543211', await bcrypt.hash('password123', 10)],
      ['Amit Kumar', 'amit.kumar@email.com', '+91-9876543212', await bcrypt.hash('password123', 10)],
      ['Sneha Patel', 'sneha.patel@email.com', '+91-9876543213', await bcrypt.hash('password123', 10)],
      ['Vikram Reddy', 'vikram.reddy@email.com', '+91-9876543214', await bcrypt.hash('password123', 10)],
      ['Anita Desai', 'anita.desai@email.com', '+91-9876543215', await bcrypt.hash('password123', 10)],
      ['Rohit Verma', 'rohit.verma@email.com', '+91-9876543216', await bcrypt.hash('password123', 10)],
      ['Kavita Joshi', 'kavita.joshi@email.com', '+91-9876543217', await bcrypt.hash('password123', 10)],
      ['Arjun Mehta', 'arjun.mehta@email.com', '+91-9876543218', await bcrypt.hash('password123', 10)],
      ['Neha Gupta', 'neha.gupta@email.com', '+91-9876543219', await bcrypt.hash('password123', 10)]
    ];

    for (const passenger of passengers) {
      await pool.query(
        'INSERT INTO Passenger (Name, Email, Phone, Password) VALUES (?, ?, ?, ?)',
        passenger
      );
    }
    console.log(`✅ Added ${passengers.length} sample passengers\n`);

    // 8. SAMPLE RESERVATIONS & TICKETS
    console.log('📋 Adding Sample Reservations and Tickets...');
    
    // Get some flight IDs
    const [flightRows] = await pool.query('SELECT Flight_ID, Price FROM Flight LIMIT 20');
    const [passengerRows] = await pool.query('SELECT Passenger_ID FROM Passenger LIMIT 10');
    
    let reservationCount = 0;
    for (let i = 0; i < Math.min(flightRows.length, 15); i++) {
      const flight = flightRows[i];
      const passenger = passengerRows[i % passengerRows.length];
      const classes = ['ECONOMY', 'BUSINESS', 'FIRST'];
      const travelClass = classes[Math.floor(Math.random() * classes.length)];
      const seatNo = `${Math.floor(Math.random() * 30) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`;
      
      try {
        const [resResult] = await pool.query(
          'INSERT INTO Reservation (Passenger_ID, Flight_ID, Booking_Date, Status) VALUES (?, ?, NOW(), ?)',
          [passenger.Passenger_ID, flight.Flight_ID, 'CONFIRMED']
        );
        
        const ticketCode = `TKT${String(resResult.insertId).padStart(8, '0')}`;
        await pool.query(
          'INSERT INTO Ticket (Reservation_ID, Ticket_Code, Seat_No, Class, Issue_Date) VALUES (?, ?, ?, ?, NOW())',
          [resResult.insertId, ticketCode, seatNo, travelClass]
        );
        
        const paymentMode = ['CARD', 'UPI', 'NET_BANKING'][Math.floor(Math.random() * 3)];
        await pool.query(
          'INSERT INTO Payment (Reservation_ID, Amount, Payment_Date, Payment_Mode, Status) VALUES (?, ?, NOW(), ?, ?)',
          [resResult.insertId, flight.Price, paymentMode, 'SUCCESS']
        );
        
        reservationCount++;
      } catch (err) {
        // Skip if any constraint fails
      }
    }
    console.log(`✅ Added ${reservationCount} sample reservations with tickets and payments\n`);

    console.log('🎉 Database population completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • ${airlines.length} Airlines`);
    console.log(`   • ${airports.length} Airports`);
    console.log(`   • ${aircraft.length} Aircraft`);
    console.log(`   • ${routes.length} Routes`);
    console.log(`   • ${flights.length} Flights (30 days)`);
    console.log(`   • ${crew.length} Crew Members`);
    console.log(`   • ${passengers.length} Sample Passengers`);
    console.log(`   • ${reservationCount} Sample Bookings\n`);
    
    console.log('💡 Sample Login Credentials:');
    console.log('   Email: rahul.sharma@email.com');
    console.log('   Password: password123\n');

  } catch (error) {
    console.error('❌ Error populating database:', error);
  } finally {
    await pool.end();
  }
}

populateDatabase();
