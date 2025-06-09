// Security Scanner API client that uses CORS proxy
const SCANNER_API_BASE = 'https://app.pentest-tools.com/api/v2';

export interface ProxyTarget {
  id: number;
  name: string;
  description?: string;
  workspace_id?: number;
}

export interface ProxyScan {
  id: number;
  tool_id: number;
  target_id: number;
  status?: string;
  status_name?: string;
  progress?: number;
  created_at?: string;
  finished_at?: string;
  start_time?: string;
  end_time?: string;
}

export interface ProxyScanOptions {
  tool_id: number;
  target_name?: string;
  target_id?: number;
  tool_params: Record<string, any>;
}

// Tool IDs for security scanners
export const ProxySecurityToolId = {
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

class SecurityScannerProxyService {
  private apiKey: string;

  constructor() {
    // API key can be provided by frontend or use the one from backend
    this.apiKey = '43cIriuvQ9qEeFFaYbFDKpfzwLWuUA92tq7sOpzJ046a87e7';
  }

  private buildProxyUrl(path: string): string {
    const targetUrl = `${SCANNER_API_BASE}${path}`;
    // Use thingproxy.freeboard.io which works without API key
    return `https://thingproxy.freeboard.io/fetch/${targetUrl}`;
  }

  private async request(method: string, path: string, data?: any) {
    const proxyUrl = this.buildProxyUrl(path);
    console.log('Making CORS proxy request to:', proxyUrl);
    
    const response = await fetch(proxyUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  // Target Management
  async createTarget(name: string, description?: string): Promise<ProxyTarget> {
    const result = await this.request('POST', '/targets', { name, description });
    return result.data;
  }

  async getTargets(): Promise<ProxyTarget[]> {
    const result = await this.request('GET', '/targets');
    return result.data || [];
  }

  async getTarget(targetId: number): Promise<ProxyTarget> {
    const result = await this.request('GET', `/targets/${targetId}`);
    return result.data;
  }

  // Scan Management
  async startScan(options: ProxyScanOptions): Promise<{ scan_id: number; target_id: number }> {
    const result = await this.request('POST', '/scans', options);
    return {
      scan_id: result.data?.created_id || result.data?.id,
      target_id: result.data?.target_id,
    };
  }

  async getScanStatus(scanId: number): Promise<ProxyScan> {
    const result = await this.request('GET', `/scans/${scanId}`);
    return result.data;
  }

  async getScanOutput(scanId: number): Promise<any> {
    const result = await this.request('GET', `/scans/${scanId}/output`);
    return result.data;
  }

  async stopScan(scanId: number): Promise<void> {
    await this.request('POST', `/scans/${scanId}/stop`);
  }

  async deleteScan(scanId: number): Promise<void> {
    await this.request('DELETE', `/scans/${scanId}`);
  }

  // WordPress Scanner
  async startWordPressScan(target: string, params: any = {}): Promise<{ scan_id: number; target_id: number }> {
    return this.startScan({
      tool_id: ProxySecurityToolId.WORDPRESS_SCANNER,
      target_name: target,
      tool_params: params,
    });
  }

  // Website Scanner
  async startWebsiteScan(target: string, params: any = {}): Promise<{ scan_id: number; target_id: number }> {
    return this.startScan({
      tool_id: ProxySecurityToolId.WEBSITE_SCANNER,
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

export const securityScannerProxyService = new SecurityScannerProxyService();
export default securityScannerProxyService;