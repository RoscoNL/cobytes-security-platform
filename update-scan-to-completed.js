const { Client } = require('pg');

async function updateScanToCompleted() {
  console.log('🔧 Updating Scan Status to Completed');
  console.log('====================================\n');
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'cobytes_db',
    user: 'cobytes_user',
    password: 'cobytes_password'
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Update scans with results to completed status
    const updateResult = await client.query(`
      UPDATE scans 
      SET status = 'completed',
          completed_at = CASE 
            WHEN completed_at IS NULL THEN NOW() 
            ELSE completed_at 
          END
      WHERE id IN (44, 37)
      RETURNING id, target, status
    `);
    
    console.log(`\n✅ Updated ${updateResult.rowCount} scans to completed status:`);
    updateResult.rows.forEach(scan => {
      console.log(`   Scan ${scan.id}: ${scan.target} → ${scan.status}`);
    });
    
    // Verify the update
    const verifyResult = await client.query(`
      SELECT s.id, s.target, s.type, s.status, COUNT(sr.id) as result_count
      FROM scans s
      LEFT JOIN scan_results sr ON sr."scanId" = s.id
      WHERE s.status = 'completed'
      GROUP BY s.id
      HAVING COUNT(sr.id) > 0
      ORDER BY s.id DESC
      LIMIT 5
    `);
    
    console.log(`\n📊 Completed scans with results: ${verifyResult.rowCount}`);
    verifyResult.rows.forEach(scan => {
      console.log(`   Scan ${scan.id}: ${scan.target} (${scan.type}) - ${scan.result_count} results`);
    });
    
    console.log('\n🎉 Success! The ScanDemo page should now show real results!');
    console.log('   Visit http://localhost:3002/scan-demo to see them');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

updateScanToCompleted();