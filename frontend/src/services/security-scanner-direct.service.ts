// Direct CORS implementation for Security Scanner API v2
// CORS is supported for direct API access

const API_KEY = process.env.REACT_APP_SCANNER_API_KEY || 'E0Eq4lmxoJeMSd6DIGLiqCW4yGRnJKywjhnXl78r471e4e69';
const API_URL = 'https://app.pentest-tools.com/api/v2';

export interface Target {
  id: number;
  name: string;
  description?: string;
  workspace_id?: number;
}

export interface Scan {
  id: number;
  tool_id: number;
  target_id: number;
  status: 'waiting' | 'in_progress' | 'finished' | 'failed';
  progress?: number;
  created_at: string;
  finished_at?: string;
}

export interface ScanOptions {
  tool_id: number;
  target_name?: string;
  target_id?: number;
  tool_params?: Record<string, any>;
}

// Tool IDs for Security Scanner API v2
export const ToolId = {
  SUBDOMAIN_FINDER: 20,
  EMAIL_FINDER: 25,
  WHOIS_LOOKUP: 40,
  DNS_LOOKUP: 50,
  DNS_ZONE_TRANSFER: 60,
  TCP_PORT_SCANNER: 70,
  UDP_PORT_SCANNER: 80,
  URL_FUZZER: 90,
  PING_HOST: 100,
  SSL_SCANNER: 110,
  HTTP_HEADERS: 120,
  WEBSITE_SCANNER: 170,
  WAF_DETECTOR: 180,
  SHARE_POINT_SCANNER: 260,
  WORDPRESS_SCANNER: 270,
  DRUPAL_SCANNER: 280,
  JOOMLA_SCANNER: 290,
  WEBSITE_RECON: 310,
  NETWORK_SCANNER: 350,
  DOMAIN_FINDER: 390,
  PASSWORD_AUDITOR: 400,
  SSL_SCANNER_ADV: 450,
  SNIPER: 490,
  WAF_DETECTOR_ADV: 500,
  API_SCANNER: 510,
  CLOUD_SCANNER: 520,
  KUBERNETES_SCANNER: 540,
};

class SecurityScannerDirectService {
  private headers: HeadersInit;

  constructor() {
    this.headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  // Make a direct CORS request
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
        mode: 'cors', // Enable CORS
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  // Target Management
  async createTarget(name: string, description?: string): Promise<Target> {
    const result = await this.makeRequest('/targets', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    return result.data;
  }

  async getTargets(): Promise<Target[]> {
    const result = await this.makeRequest('/targets');
    return result.data || [];
  }

  async getTarget(targetId: number): Promise<Target> {
    const result = await this.makeRequest(`/targets/${targetId}`);
    return result.data;
  }

  // Scan Management
  async startScan(options: ScanOptions): Promise<{ scan_id: number; target_id: number }> {
    console.log('Starting scan with options:', options);
    
    const result = await this.makeRequest('/scans', {
      method: 'POST',
      body: JSON.stringify(options),
    });

    return {
      scan_id: result.data?.created_id || result.data?.id,
      target_id: result.data?.target_id || options.target_id,
    };
  }

  async getScanStatus(scanId: number): Promise<Scan> {
    const result = await this.makeRequest(`/scans/${scanId}`);
    return result.data;
  }

  async getScanOutput(scanId: number): Promise<any> {
    const result = await this.makeRequest(`/scans/${scanId}/output`);
    return result.data;
  }

  async stopScan(scanId: number): Promise<void> {
    await this.makeRequest(`/scans/${scanId}/stop`, {
      method: 'POST',
    });
  }

  async deleteScan(scanId: number): Promise<void> {
    await this.makeRequest(`/scans/${scanId}`, {
      method: 'DELETE',
    });
  }

  // WordPress Scanner specific
  async startWordPressScan(target: string, params: any = {}): Promise<{ scan_id: number; target_id: number }> {
    // First check if target exists
    const targets = await this.getTargets();
    let targetId: number | undefined;
    
    const existingTarget = targets.find(t => t.name === target);
    if (existingTarget) {
      targetId = existingTarget.id;
    } else {
      // Create new target
      const newTarget = await this.createTarget(target, `Security scan for ${target}`);
      targetId = newTarget.id;
    }

    // Start the scan
    return this.startScan({
      tool_id: ToolId.WORDPRESS_SCANNER,
      target_id: targetId,
      tool_params: {
        target,
        ...params,
      },
    });
  }

  // Helper to poll scan status
  async waitForScanCompletion(
    scanId: number, 
    onProgress?: (status: Scan) => void,
    maxWaitTime: number = 600000 // 10 minutes
  ): Promise<{ status: Scan; output: any }> {
    const startTime = Date.now();
    const pollInterval = 3000; // 3 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await this.getScanStatus(scanId);
        
        if (onProgress) {
          onProgress(status);
        }

        if (status.status === 'finished') {
          const output = await this.getScanOutput(scanId);
          return { status, output };
        }

        if (status.status === 'failed') {
          throw new Error('Scan failed');
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('Error polling scan:', error);
        throw error;
      }
    }

    throw new Error('Scan timed out');
  }
}

export const securityScannerDirectService = new SecurityScannerDirectService();
export default securityScannerDirectService;