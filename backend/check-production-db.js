const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Production database configuration
const config = {
  host: 'db-securityscan-ams3-do-user-170668-0.k.db.ondigitalocean.com',
  port: 25060,
  user: 'doadmin',
  password: process.env.DB_PASSWORD,
  database: 'defaultdb',
  ssl: {
    rejectUnauthorized: false
  }
};

console.log('🔌 Connecting to production database...');

const client = new Client(config);

async function checkDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to production database!');
    
    // Check tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n📋 Tables in database (${tablesResult.rows.length}):`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check scans
    const scansResult = await client.query('SELECT COUNT(*) as count FROM scans');
    console.log(`\n📊 Scans in database: ${scansResult.rows[0].count}`);
    
    if (scansResult.rows[0].count > 0) {
      const recentScans = await client.query(`
        SELECT id, target, type, status, created_at 
        FROM scans 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      console.log('\n🔍 Recent scans:');
      recentScans.rows.forEach(scan => {
        console.log(`   - ${scan.id}: ${scan.target} (${scan.type}) - ${scan.status} - ${scan.created_at}`);
      });
    }
    
    // Check scan results
    const resultsResult = await client.query('SELECT COUNT(*) as count FROM scan_results');
    console.log(`\n📈 Scan results in database: ${resultsResult.rows[0].count}`);
    
    // Check users
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`\n👥 Users in database: ${usersResult.rows[0].count}`);
    
    // Check scheduled scans
    const scheduledResult = await client.query('SELECT COUNT(*) as count FROM scheduled_scans');
    console.log(`\n⏰ Scheduled scans: ${scheduledResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

checkDatabase();