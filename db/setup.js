import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function setupDatabase() {
  let connection;
  try {
    // Connect to MySQL server (without database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Kavya@20',
      multipleStatements: true
    });

    console.log('✓ Connected to MySQL server');

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Creating database and tables...');
    await connection.query(schema);

    console.log('✓ Database setup completed successfully!');
    console.log('✓ Database: flight_reservation');
    console.log('✓ All tables created');
    console.log('✓ Sample data inserted');

  } catch (error) {
    console.error('✗ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
