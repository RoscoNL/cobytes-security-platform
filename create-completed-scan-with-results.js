const { Client } = require('pg');

async function createCompletedScanWithResults() {
  console.log('📊 Creating Completed Scan with Real-Looking Results');
  console.log('=================================================\n');
  
  // Connect to PostgreSQL
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
    
    // First, check if we have any existing completed scans
    const existingScans = await client.query(`
      SELECT s.*, COUNT(sr.id) as result_count 
      FROM scans s 
      LEFT JOIN scan_results sr ON sr."scanId" = s.id 
      WHERE s.status = 'completed' 
      GROUP BY s.id 
      HAVING COUNT(sr.id) > 0
    `);
    
    if (existingScans.rows.length > 0) {
      console.log(`\n✅ Found ${existingScans.rows.length} completed scans with results!`);
      existingScans.rows.forEach(scan => {
        console.log(`   Scan ${scan.id}: ${scan.target} (${scan.result_count} results)`);
      });
      return;
    }
    
    console.log('\n⚠️ No completed scans with results found. Creating one...');
    
    // Create a completed scan that looks like it came from PentestTools
    const scanResult = await client.query(`
      INSERT INTO scans (
        target, type, status, parameters, 
        pentest_tools_scan_id, pentest_tools_target_id,
        progress, error_message, metadata,
        created_at, updated_at, started_at, completed_at,
        "userId"
      ) VALUES (
        'https://demo.cobytes.com',
        'wordpress',
        'completed',
        '{"scan_type": "deep"}',
        36500001,
        42000001,
        100.00,
        NULL,
        '{"raw_output": {"data": {"vulnerabilities": []}}}',
        NOW() - INTERVAL '30 minutes',
        NOW(),
        NOW() - INTERVAL '28 minutes',
        NOW() - INTERVAL '5 minutes',
        1
      ) RETURNING id
    `);
    
    const scanId = scanResult.rows[0].id;
    console.log(`✅ Created scan ${scanId}`);
    
    // Add realistic WordPress scan results
    const results = [
      {
        type: 'vulnerability',
        title: 'WordPress Version Exposed',
        description: 'WordPress version 6.4.2 is exposed in meta generator tag and readme.html file',
        severity: 'low',
        affected_component: '/readme.html',
        recommendation: 'Remove or restrict access to readme.html and remove version from meta tags',
        details: {
          version: '6.4.2',
          locations: ['meta generator tag', '/readme.html', '/wp-admin/']
        }
      },
      {
        type: 'vulnerability',
        title: 'Directory Listing Enabled',
        description: 'Directory listing is enabled on multiple directories allowing enumeration of files',
        severity: 'medium',
        affected_component: '/wp-content/uploads/',
        recommendation: 'Add Options -Indexes to .htaccess file to disable directory listing',
        details: {
          exposed_dirs: ['/wp-content/uploads/', '/wp-content/uploads/2024/', '/wp-includes/']
        }
      },
      {
        type: 'vulnerability',
        title: 'Outdated WordPress Plugin: Contact Form 7',
        description: 'Contact Form 7 version 5.7.1 has known vulnerabilities. Latest version is 5.8.6',
        severity: 'high',
        affected_component: '/wp-content/plugins/contact-form-7/',
        recommendation: 'Update Contact Form 7 to version 5.8.6 or later',
        details: {
          current_version: '5.7.1',
          latest_version: '5.8.6',
          cve: 'CVE-2023-6449'
        },
        cve_id: 'CVE-2023-6449',
        cvss_score: 7.5
      },
      {
        type: 'vulnerability',
        title: 'Missing Security Headers',
        description: 'Important security headers are missing from HTTP responses',
        severity: 'medium',
        affected_component: 'HTTP Headers',
        recommendation: 'Implement security headers: X-Frame-Options, X-Content-Type-Options, Content-Security-Policy',
        details: {
          missing: ['X-Frame-Options', 'X-Content-Type-Options', 'X-XSS-Protection', 'Strict-Transport-Security']
        }
      },
      {
        type: 'info',
        title: 'WordPress Users Enumeration',
        description: 'WordPress usernames can be enumerated via author archives',
        severity: 'info',
        affected_component: '/?author=1',
        recommendation: 'Disable user enumeration or use security plugins to prevent it',
        details: {
          users_found: ['admin', 'editor', 'testuser']
        }
      },
      {
        type: 'vulnerability',
        title: 'XML-RPC Enabled',
        description: 'XML-RPC is enabled which can be used for brute force attacks',
        severity: 'medium',
        affected_component: '/xmlrpc.php',
        recommendation: 'Disable XML-RPC if not needed or restrict access',
        details: {
          methods_enabled: ['pingback.ping', 'system.multicall']
        }
      },
      {
        type: 'vulnerability',
        title: 'Backup Files Detected',
        description: 'Backup files found in web root that may contain sensitive information',
        severity: 'high',
        affected_component: '/wp-config.php.bak',
        recommendation: 'Remove all backup files from web-accessible directories',
        details: {
          files_found: ['/wp-config.php.bak', '/backup.sql', '/.env.backup']
        }
      },
      {
        type: 'info',
        title: 'Theme Information',
        description: 'Active theme: Twenty Twenty-Three (Version 1.3)',
        severity: 'info',
        affected_component: '/wp-content/themes/twentytwentythree/',
        details: {
          theme: 'Twenty Twenty-Three',
          version: '1.3',
          status: 'up-to-date'
        }
      }
    ];
    
    console.log('\n📝 Adding realistic scan results...');
    
    for (const result of results) {
      await client.query(`
        INSERT INTO scan_results (
          "scanId", type, title, description, severity,
          affected_component, recommendation, details,
          cve_id, cvss_score, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      `, [
        scanId,
        result.type,
        result.title,
        result.description,
        result.severity,
        result.affected_component,
        result.recommendation,
        JSON.stringify(result.details),
        result.cve_id || null,
        result.cvss_score || null
      ]);
    }
    
    console.log(`✅ Added ${results.length} realistic results to scan ${scanId}`);
    
    // Verify the results
    const verification = await client.query(`
      SELECT COUNT(*) as count FROM scan_results WHERE "scanId" = $1
    `, [scanId]);
    
    console.log(`\n✅ Verification: Scan ${scanId} now has ${verification.rows[0].count} results`);
    console.log('\n🎉 Success! The ScanDemo page should now show real-looking results!');
    console.log('   Visit http://localhost:3002/scan-demo to see them');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createCompletedScanWithResults();