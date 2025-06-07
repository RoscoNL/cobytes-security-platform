const { DataSource } = require('typeorm');
const fs = require('fs');
const path = require('path');

// Import all entities
const { User } = require('./dist/models/user.model');
const { Scan } = require('./dist/models/scan.model');
const { ScanResult } = require('./dist/models/scanResult.model');
const { ScheduledScan } = require('./dist/models/scheduledScan.model');

// Production database configuration
const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'db-securityscan-ams3-do-user-170668-0.k.db.ondigitalocean.com',
  port: 25060,
  username: 'doadmin',
  password: process.env.DB_PASSWORD || 'your-password-here',
  database: 'defaultdb',
  ssl: {
    rejectUnauthorized: false
  },
  synchronize: true, // This will create tables
  logging: true,
  entities: [User, Scan, ScanResult, ScheduledScan]
});

async function initializeDatabase() {
  try {
    console.log('🔌 Connecting to production database...');
    await AppDataSource.initialize();
    console.log('✅ Connected to production database!');
    console.log('📊 Tables should now be created automatically by TypeORM');
    
    // Verify tables were created
    const queryRunner = AppDataSource.createQueryRunner();
    const tables = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n✅ Tables created (${tables.length}):`);
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    await queryRunner.release();
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  } finally {
    await AppDataSource.destroy();
    console.log('\n🔌 Connection closed');
  }
}

initializeDatabase();