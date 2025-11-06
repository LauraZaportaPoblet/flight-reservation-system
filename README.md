# ✈️ Flight Reservation System

A modern, full-stack flight reservation platform with user authentication, real-time seat availability, and automatic ticket generation.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure login and registration with JWT tokens and bcrypt password hashing
- **Flight Search**: Advanced search with filters (airline, route, date, price range)
- **Real-time Booking**: Live seat availability checks and instant reservation
- **Payment Processing**: Integrated payment system with transaction tracking
- **Automatic Ticketing**: Tickets generated automatically via database triggers
- **Profile Management**: Edit profile information and change password
- **Dark Mode**: Multiple theme options (Light, Dark, Cupcake, Cyberpunk, Forest)

### Technical Features
- **RESTful API**: Clean, organized Express.js backend
- **Database Triggers**: Automated ticket generation on successful payment
- **Stored Procedures**: Efficient database operations
- **Foreign Key Constraints**: Data integrity and referential consistency
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **Modern UI**: DaisyUI components with smooth animations

## 🛠️ Tech Stack

**Backend:**
- Node.js & Express.js
- MySQL 8.0 with mysql2
- JWT for authentication
- bcryptjs for password hashing
- CORS enabled

**Frontend:**
- React 18 with Vite
- Tailwind CSS
- DaisyUI component library
- React Router for navigation
- Axios for API calls

**Database:**
- MySQL 8.0
- Comprehensive schema with 15+ tables
- Stored procedures and functions
- Database triggers for automation

## 📋 Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- MySQL Workbench (recommended)

## ⚡ Quick Start

### 1. Database Setup

Open MySQL Workbench and run the database schema:

```bash
# Option 1: Using MySQL Workbench
# - Open db/schema-with-data.sql
# - Execute the entire script

# Option 2: Using command line
mysql -u root -p < db/schema-with-data.sql
```

This creates:
- 15 airlines
- 25 airports (major international hubs)
- 80+ routes
- 19 aircraft types
- 60 crew members
- 70+ flights (next 3 days)
- 20 sample passengers
- 20 sample bookings with tickets

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your MySQL credentials
# DB_PASSWORD=your_mysql_password

# Start the server
npm run dev
```

Backend runs on: `http://localhost:4000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5174`

### 4. Login

Use one of the sample accounts:
- Email: `john.doe@email.com`
- Password: `password123`

(20 sample accounts available - see schema-with-data.sql for full list)

## 📁 Project Structure

```
flight/
├── backend/
│   ├── src/
│   │   ├── server.js           # Main Express server
│   │   ├── db.js               # Database connection
│   │   └── middleware/         # Authentication middleware
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   ├── contexts/           # React contexts (Auth)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── package.json
│
├── db/
│   ├── schema.sql              # Basic schema
│   └── schema-with-data.sql    # Schema + comprehensive seed data
│
├── .gitignore
└── README.md
```

## 🔑 Key Features Explained

### Authentication System
- JWT-based authentication
- Secure password hashing with bcrypt
- Protected routes requiring authentication
- Automatic token refresh

### Dashboard
- Flight statistics overview
- Recent bookings summary
- Upcoming flights display
- Quick action buttons

### Flight Management
- Search by origin, destination, date
- Filter by airline, price range
- Real-time seat availability
- Detailed flight information

### Booking System
- Step-by-step reservation process
- Seat selection interface
- Payment integration
- Instant confirmation

### Profile Management
- Edit personal information
- Change password securely
- View booking history
- Manage preferences

### Theme Customization
- 5 built-in themes
- Light and dark mode support
- Smooth transitions
- Persistent theme selection

## 🗄️ Database Schema

### Core Tables
- `Passenger`: User accounts and information
- `Flight`: Flight schedules and details
- `Reservation`: Booking records
- `Ticket`: Generated tickets
- `Payment`: Transaction records
- `Airport`: Airport information
- `Aircraft`: Aircraft specifications
- `Airline`: Airline details
- `Route`: Flight routes
- `Crew`: Flight crew members

### Advanced Features
- **Stored Procedures**: `book_flight`, `calculate_total_revenue`
- **Functions**: `get_available_seats`, `is_flight_full`
- **Triggers**: Automatic ticket generation on payment
- **Views**: Aggregated flight and booking statistics

## 🔧 Configuration

### Backend Environment Variables

```env
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=flight_reservation
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
```

### Frontend Configuration

Update API URL in `frontend/src/config.ts` if needed:

```javascript
export const API_URL = 'http://localhost:4000';
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Passengers
- `GET /api/passengers` - List all passengers
- `GET /api/passengers/:id` - Get passenger details
- `PUT /api/passengers/:id` - Update passenger profile
- `PUT /api/passengers/:id/password` - Change password

### Flights
- `GET /api/flights` - Search flights
- `GET /api/flights/:id` - Get flight details
- `POST /api/flights` - Create new flight (admin)

### Reservations
- `GET /api/reservations` - List user reservations
- `POST /api/reservations` - Create new booking
- `GET /api/reservations/:id` - Get booking details

### Tickets & Payments
- `GET /api/tickets` - List all tickets
- `GET /api/payments` - List all payments

## 🎨 UI Themes

Available themes:
1. **Light** - Clean white theme
2. **Dark** - Modern dark theme
3. **Cupcake** - Soft pastel colors
4. **Cyberpunk** - Neon futuristic
5. **Forest** - Nature-inspired green

Access theme switcher in Settings page.

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check MySQL is running
mysql --version

# Test connection
mysql -u root -p

# Verify database exists
USE flight_reservation;
SHOW TABLES;
```

### Backend Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check if port 4000 is available
# Windows: netstat -ano | findstr :4000
```

### Frontend Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Verify API URL in config
# Check browser console for errors
```

## 🚀 Deployment

### Backend (Node.js)
- Deploy to Heroku, Railway, or AWS
- Set environment variables
- Update CORS settings for production domain

### Frontend (React)
- Build: `npm run build`
- Deploy to Vercel, Netlify, or AWS S3
- Update API_URL to production backend

### Database (MySQL)
- Use managed MySQL (AWS RDS, PlanetScale)
- Import schema and seed data
- Configure connection pooling

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Built with ❤️ for a database management project

## 🙏 Acknowledgments

- DaisyUI for the beautiful component library
- OpenAI for development assistance
- MySQL for robust database management

---

**Note**: This is a student project for educational purposes. Not intended for production use without proper security audits and enhancements.

### ERD Mapping
Entities included: `Passenger`, `Reservation`, `Payment`, `Ticket`, `Flight`, `Airport`, `Airline`, `Aircraft`, `Crew`, `Route`. Major relations are implemented with constraints, and consistency rules are enforced via triggers/procedures.

### Security Notes
- Authentication implemented with JWT tokens and bcrypt password hashing
- Protected routes require authentication
- This demo is designed for local use and clarity. Add input validation, rate limiting, and production hardening before deploying.
- Default seed password is 'password123' - change in production

### Authentication
- Register a new account or use seed accounts:
  - Email: rahul@example.com, Password: password123
  - Email: sara@example.com, Password: password123


