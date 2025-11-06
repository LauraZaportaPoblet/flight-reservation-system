import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
    console.log('🔧 Setting up flight reservation database...\n');
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Kavya@20',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });

        console.log('✅ Connected to MySQL server');

        const schemaPath = '../db/schema.sql';
        console.log(`📄 Reading schema file: ${schemaPath}`);
        
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('⚡ Executing SQL schema...');
        await connection.query(schema);
        
        console.log('\n✅ Database setup completed successfully!');
        console.log('\n📊 Flight Reservation System:');
        console.log('   - Database: flight_reservation');
        console.log('   - Tables: passenger, flight, booking, payment');
        console.log('   - Sample flights loaded');
        
        await connection.end();
        console.log('\n🎉 You can now create accounts and make reservations!\n');
        
    } catch (error) {
        console.error('❌ Error setting up database:', error.message);
        process.exit(1);
    }
}

setupDatabase();
