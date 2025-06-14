// Security Scanner API client using CORS proxy
const API_KEY = '43cIriuvQ9qEeFFaYbFDKpfzwLWuUA92tq7sOpzJ046a87e7';
const PROXY_URL = 'https://thingproxy.freeboard.io/fetch/';
const API_URL = `${PROXY_URL}https://app.pentest-tools.com/api/v2`;

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

export interface ScannerTarget {
  id: number;
  name: string;
  description?: string;
  workspace_id?: number;
}

export interface SecurityScan {
  id: number;
  tool_id: number;
  target_id: number;
  status: string;
  progress?: number;
  created_at: string;
  finished_at?: string;
}

export interface ScanOptions {
  tool_id: number;
  target_name?: string;
  target_id?: number;
  tool_params: Record<string, any>;
}

// Tool IDs for security scanners
export const SecurityToolId = {
  SUBDOMAIN_FINDER: 20,
  TCP_PORT_SCANNER: 70,
  UDP_PORT_SCANNER: 80,
  URL_FUZZER: 90,
  FIND_VHOSTS: 160,
  WEBSITE_SCANNER: 170,
  SHARE_POINT_SCANNER: 260,
  WORDPRESS_SCANNER: 270,
  DRUPAL_SCANNER: 280,
  JOOMLA_SCANNER: 290,
  WEBSITE_RECON: 310,
  NETWORK_SCANNER: 350,
  DOMAIN_FINDER: 390,
  PASSWORD_AUDITOR: 400,
  SSL_SCANNER: 450,
  SNIPER: 490,
  WAF_DETECTOR: 500,
  API_SCANNER: 510,
  CLOUD_SCANNER: 520,
  KUBERNETES_SCANNER: 540,
};

class SecurityScannerService {
  // Target Management
  async createTarget(name: string, description?: string): Promise<ScannerTarget> {
    const response = await fetch(`${API_URL}/targets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, description }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create target: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  async getTargets(): Promise<ScannerTarget[]> {
    const response = await fetch(`${API_URL}/targets`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get targets: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  async getTarget(targetId: number): Promise<ScannerTarget> {
    const response = await fetch(`${API_URL}/targets/${targetId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get target: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Scan Management
  async startScan(options: ScanOptions): Promise<{ scan_id: number; target_id: number }> {
    const response = await fetch(`${API_URL}/scans`, {
      method: 'POST',
      headers,
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to start scan: ${response.statusText} - ${error}`);
    }

    const result = await response.json();
    return {
      scan_id: result.data?.created_id || result.data?.id,
      target_id: result.data?.target_id,
    };
  }

  async getScanStatus(scanId: number): Promise<SecurityScan> {
    const response = await fetch(`${API_URL}/scans/${scanId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get scan status: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  async getScanOutput(scanId: number): Promise<any> {
    const response = await fetch(`${API_URL}/scans/${scanId}/output`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get scan output: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  async stopScan(scanId: number): Promise<void> {
    const response = await fetch(`${API_URL}/scans/${scanId}/stop`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to stop scan: ${response.statusText}`);
    }
  }

  async deleteScan(scanId: number): Promise<void> {
    const response = await fetch(`${API_URL}/scans/${scanId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete scan: ${response.statusText}`);
    }
  }

  // WordPress Scanner
  async startWordPressScan(target: string, params: any = {}): Promise<{ scan_id: number; target_id: number }> {
    return this.startScan({
      tool_id: SecurityToolId.WORDPRESS_SCANNER,
      target_name: target,
      tool_params: params,
    });
  }

  // Helper method to poll scan status
  async waitForScanCompletion(scanId: number, onProgress?: (progress: number) => void): Promise<any> {
    const pollInterval = 2000; // 2 seconds
    const maxPolls = 300; // 10 minutes max
    let polls = 0;

    while (polls < maxPolls) {
      try {
        const status = await this.getScanStatus(scanId);
        
        if (status.progress && onProgress) {
          onProgress(status.progress);
        }

        if (status.status === 'finished') {
          const output = await this.getScanOutput(scanId);
          return { status, output };
        }

        if (status.status === 'failed' || status.status === 'error') {
          throw new Error(`Scan failed with status: ${status.status}`);
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
        polls++;
      } catch (error) {
        console.error('Error polling scan status:', error);
        throw error;
      }
    }

    throw new Error('Scan timed out after 10 minutes');
  }
}

export const securityScannerService = new SecurityScannerService();
export default securityScannerService;