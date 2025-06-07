import { logger } from '@utils/logger';

class MockScannerService {
  private mockResults: Record<string, any> = {
    wordpress: {
      title: 'WordPress Security Scan',
      findings: [
        {
          type: 'vulnerability',
          title: 'WordPress Version Disclosure',
          description: 'WordPress version 6.3.1 detected',
          severity: 'low',
          details: { version: '6.3.1', location: '/readme.html' },
          recommendation: 'Consider hiding version information'
        },
        {
          type: 'vulnerability', 
          title: 'Admin Login Page Accessible',
          description: 'WordPress admin login page is publicly accessible',
          severity: 'medium',
          details: { url: '/wp-admin' },
          recommendation: 'Implement IP whitelisting or additional authentication'
        }
      ]
    },
    ssl: {
      title: 'SSL/TLS Security Scan',
      findings: [
        {
          type: 'info',
          title: 'SSL Certificate Valid',
          description: 'SSL certificate is valid and properly configured',
          severity: 'info',
          details: { issuer: "Let's Encrypt", validUntil: '2025-09-01' }
        },
        {
          type: 'vulnerability',
          title: 'TLS 1.0/1.1 Supported',
          description: 'Deprecated TLS versions are still supported',
          severity: 'medium',
          details: { protocols: ['TLSv1.0', 'TLSv1.1'] },
          recommendation: 'Disable TLS 1.0 and 1.1'
        }
      ]
    },
    dns_lookup: {
      title: 'DNS Security Scan',
      findings: [
        {
          type: 'info',
          title: 'DNS Records Found',
          description: 'Standard DNS records configured',
          severity: 'info',
          details: { 
            A: ['93.184.216.34'],
            MX: ['mail.example.com'],
            TXT: ['v=spf1 include:_spf.google.com ~all']
          }
        }
      ]
    }
  };

  async simulateScan(scanId: string, type: string): Promise<any> {
    logger.info(`MockScanner: Starting mock scan ${scanId} of type ${type}`);
    
    // Simulate scan progress
    const progressSteps = [10, 25, 50, 75, 90, 100];
    
    for (const progress of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      
      if (progress < 100) {
        logger.info(`MockScanner: Scan ${scanId} progress: ${progress}%`);
        // In a real implementation, you would update the scan progress in the database
      }
    }
    
    // Return mock results based on scan type
    const results = this.mockResults[type] || {
      title: `${type} Scan Results`,
      findings: [
        {
          type: 'info',
          title: 'Scan Completed',
          description: `Mock ${type} scan completed successfully`,
          severity: 'info',
          details: { scanType: type }
        }
      ]
    };
    
    logger.info(`MockScanner: Scan ${scanId} completed with ${results.findings.length} findings`);
    return results;
  }

  async checkScanStatus(scanId: string): Promise<{ status: string; progress: number }> {
    // For mock purposes, always return running with random progress
    const progress = Math.floor(Math.random() * 90) + 10;
    return {
      status: progress >= 100 ? 'completed' : 'running',
      progress
    };
  }
}

export default new MockScannerService();