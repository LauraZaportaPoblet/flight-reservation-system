import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

// Global error handlers
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN?.split(',') || '*' }));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Kavya@20',
  database: process.env.DB_NAME || 'flight_reservation',
  waitForConnections: true,
  connectionLimit: 10,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Auth middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'flight-reservation-backend' });
});

// Authentication: Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [r] = await pool.query(
      'INSERT INTO Passenger (Name, Email, Phone, Password) VALUES (?,?,?,?)',
      [name, email, phone || null, hashedPassword]
    );
    const token = jwt.sign({ id: r.insertId, email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { Passenger_ID: r.insertId, Name: name, Email: email, Phone: phone } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Email already registered' });
    } else {
      res.status(500).json({ message: err.message });
    }
  }
});

// Authentication: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const [rows] = await pool.query('SELECT * FROM Passenger WHERE Email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const passenger = rows[0];
    const valid = await bcrypt.compare(password, passenger.Password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: passenger.Passenger_ID, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { Passenger_ID: passenger.Passenger_ID, Name: passenger.Name, Email: passenger.Email, Phone: passenger.Phone } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Passenger_ID, Name, Email, Phone FROM Passenger WHERE Passenger_ID = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: err.message });
  }
});

// Flights list and search
app.get('/api/flights', async (req, res) => {
  try {
    const { source, destination, date } = req.query;
    let sql = 'SELECT * FROM vw_flight_summary WHERE 1=1';
    const params = [];
    if (source) {
      sql += ' AND Departure LIKE ?';
      params.push(`%${source}%`);
    }
    if (destination) {
      sql += ' AND Arrival LIKE ?';
      params.push(`%${destination}%`);
    }
    if (date) {
      sql += ' AND Date = ?';
      params.push(date);
    }
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching flights:', err);
    res.status(500).json({ message: err.message });
  }
});

// Passenger CRUD
app.get('/api/passengers', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Passenger_ID, Name, Email, Phone FROM Passenger');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching passengers:', err);
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/passengers/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Passenger_ID, Name, Email, Phone FROM Passenger WHERE Passenger_ID=?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching passenger:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update passenger profile
app.put('/api/passengers/:id', authenticate, async (req, res) => {
  try {
    const { Name, Email, Phone } = req.body;
    const passengerId = req.params.id;

    // Verify user is updating their own profile
    if (req.user.id !== parseInt(passengerId)) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    // Check if email is already taken by another user
    if (Email) {
      const [existing] = await pool.query(
        'SELECT Passenger_ID FROM Passenger WHERE Email = ? AND Passenger_ID != ?',
        [Email, passengerId]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Email is already in use' });
      }
    }

    // Update profile
    await pool.query(
      'UPDATE Passenger SET Name = ?, Email = ?, Phone = ? WHERE Passenger_ID = ?',
      [Name, Email, Phone, passengerId]
    );

    res.json({ message: 'Profile updated successfully', user: { Name, Email, Phone } });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: err.message });
  }
});

// Change passenger password
app.put('/api/passengers/:id/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const passengerId = req.params.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Verify user is changing their own password
    if (req.user.id !== parseInt(passengerId)) {
      return res.status(403).json({ error: 'You can only change your own password' });
    }

    // Get current password hash
    const [rows] = await pool.query('SELECT Password FROM Passenger WHERE Passenger_ID=?', [passengerId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, rows[0].Password);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE Passenger SET Password = ? WHERE Passenger_ID = ?', [hashedPassword, passengerId]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: err.message });
  }
});

// Reservation: book via stored procedure
app.post('/api/reservations/book', authenticate, async (req, res) => {
  const { passengerId, flightId, seatNo, travelClass, amount, mode } = req.body;
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query('SET @rid = 0, @tid = 0');
      const callSql =
        "CALL sp_create_reservation(?, ?, ?, ?, ?, ?, @rid, @tid)";
      await conn.query(callSql, [
        passengerId,
        flightId,
        travelClass || 'ECONOMY',
        seatNo,
        amount,
        mode || 'CARD',
      ]);
      const [[ridRow]] = await conn.query('SELECT @rid AS Reservation_ID, @tid AS Ticket_ID');
      res.status(201).json(ridRow);
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get reservations for a passenger
app.get('/api/passengers/:id/reservations', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, t.Seat_No, t.Class, t.Ticket_Code, f.Flight_Number, f.Date, f.Time
       FROM Reservation r
       JOIN Ticket t ON t.Reservation_ID = r.Reservation_ID
       JOIN Flight f ON f.Flight_ID = r.Flight_ID
       WHERE r.Passenger_ID = ?
       ORDER BY r.Booking_Date DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching reservations:', err);
    res.status(500).json({ message: err.message });
  }
});

// Cancel reservation
app.post('/api/reservations/:id/cancel', authenticate, async (req, res) => {
  try {
    await pool.query('CALL sp_cancel_reservation(?)', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Airport CRUD
app.get('/api/airports', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Airport ORDER BY Name');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching airports:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/airports', authenticate, async (req, res) => {
  const { name, location } = req.body;
  try {
    const [r] = await pool.query('INSERT INTO Airport (Name, Location) VALUES (?,?)', [name, location]);
    res.status(201).json({ Airport_ID: r.insertId, Name: name, Location: location });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Aircraft CRUD
app.get('/api/aircraft', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Aircraft ORDER BY Model');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching aircraft:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/aircraft', authenticate, async (req, res) => {
  const { model, capacity } = req.body;
  try {
    const [r] = await pool.query('INSERT INTO Aircraft (Model, Capacity) VALUES (?,?)', [model, capacity]);
    res.status(201).json({ Aircraft_ID: r.insertId, Model: model, Capacity: capacity });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Crew CRUD
app.get('/api/crew', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Crew ORDER BY Name');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching crew:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/crew', authenticate, async (req, res) => {
  const { name, role } = req.body;
  try {
    const [r] = await pool.query('INSERT INTO Crew (Name, Role) VALUES (?,?)', [name, role]);
    res.status(201).json({ Crew_ID: r.insertId, Name: name, Role: role });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Airline CRUD
app.get('/api/airlines', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Airline ORDER BY Name');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching airlines:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/airlines', authenticate, async (req, res) => {
  const { code, name } = req.body;
  try {
    const [r] = await pool.query('INSERT INTO Airline (Code, Name) VALUES (?,?)', [code, name]);
    res.status(201).json({ Airline_ID: r.insertId, Code: code, Name: name });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Route CRUD
app.get('/api/routes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Route ORDER BY Source, Destination');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching routes:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/routes', authenticate, async (req, res) => {
  const { source, destination } = req.body;
  try {
    const [r] = await pool.query('INSERT INTO Route (Source, Destination) VALUES (?,?)', [source, destination]);
    res.status(201).json({ Route_ID: r.insertId, Source: source, Destination: destination });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Ticket CRUD
app.get('/api/tickets', authenticate, async (req, res) => {
  try {
    const sql = `SELECT t.*, r.Status, r.Booking_Date, f.Flight_Number, f.Date AS Flight_Date, f.Time AS Flight_Time
      FROM Ticket t
      JOIN Reservation r ON r.Reservation_ID = t.Reservation_ID
      JOIN Flight f ON f.Flight_ID = r.Flight_ID
      ORDER BY t.Ticket_ID DESC`;
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/tickets/:id', authenticate, async (req, res) => {
  try {
    const sql = `SELECT t.*, r.Status, r.Booking_Date, f.Flight_Number, f.Date AS Flight_Date, f.Time AS Flight_Time,
      p.Name AS Passenger_Name, p.Email AS Passenger_Email
      FROM Ticket t
      JOIN Reservation r ON r.Reservation_ID = t.Reservation_ID
      JOIN Flight f ON f.Flight_ID = r.Flight_ID
      JOIN Passenger p ON p.Passenger_ID = r.Passenger_ID
      WHERE t.Ticket_ID = ?`;
    const [rows] = await pool.query(sql, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching ticket:', err);
    res.status(500).json({ message: err.message });
  }
});

// Payment CRUD
app.get('/api/payments', authenticate, async (req, res) => {
  try {
    const sql = `SELECT p.*, r.Status, r.Booking_Date, f.Flight_Number
      FROM Payment p
      JOIN Reservation r ON r.Reservation_ID = p.Reservation_ID
      JOIN Flight f ON f.Flight_ID = r.Flight_ID
      ORDER BY p.Paid_At DESC`;
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ message: err.message });
  }
});

// Flight CRUD (admin)
app.post('/api/flights', authenticate, async (req, res) => {
  const { flightNumber, airlineId, aircraftId, routeId, departureAirportId, arrivalAirportId, date, time, baseFare } = req.body;
  try {
    const [r] = await pool.query(
      'INSERT INTO Flight (Flight_Number, Airline_ID, Aircraft_ID, Route_ID, Departure_Airport_ID, Arrival_Airport_ID, Date, Time, Base_Fare) VALUES (?,?,?,?,?,?,?,?,?)',
      [flightNumber, airlineId, aircraftId, routeId, departureAirportId, arrivalAirportId, date, time, baseFare || 0]
    );
    res.status(201).json({ Flight_ID: r.insertId });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

app.get('/api/flights/:id', async (req, res) => {
  try {
    const sql = `SELECT f.*, a.Name AS Airline_Name, a.Code AS Airline_Code,
      ac.Model AS Aircraft_Model, ac.Capacity,
      r.Source, r.Destination,
      ap1.Name AS Departure_Airport, ap1.Location AS Departure_Location,
      ap2.Name AS Arrival_Airport, ap2.Location AS Arrival_Location
      FROM Flight f
      JOIN Airline a ON a.Airline_ID = f.Airline_ID
      JOIN Aircraft ac ON ac.Aircraft_ID = f.Aircraft_ID
      JOIN Route r ON r.Route_ID = f.Route_ID
      JOIN Airport ap1 ON ap1.Airport_ID = f.Departure_Airport_ID
      JOIN Airport ap2 ON ap2.Airport_ID = f.Arrival_Airport_ID
      WHERE f.Flight_ID = ?`;
    const [rows] = await pool.query(sql, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching flight:', err);
    res.status(500).json({ message: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// Test database connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Database connection successful');
    connection.release();
  } catch (err) {
    console.error('✗ Database connection failed:', err.message);
    console.error('  Please check your .env file and ensure MySQL is running');
    process.exit(1);
  }
}

const port = Number(process.env.PORT || 4000);

// Test connection and start server
testConnection().then(() => {
  app.listen(port, () => {
    console.log(`✓ API running on http://localhost:${port}`);
    console.log(`✓ Health check: http://localhost:${port}/api/health`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});


