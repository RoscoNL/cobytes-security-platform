import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

// Tool IDs from Security Scanner API
export enum SecurityToolId {
  SUBDOMAIN_FINDER = 20,
  WHOIS_LOOKUP = 40,
  EMAIL_FINDER = 25,
  DNS_LOOKUP = 50,
  DNS_ZONE_TRANSFER = 60,
  TCP_PORT_SCANNER = 70,
  UDP_PORT_SCANNER = 80,
  URL_FUZZER = 90,
  PING_HOST = 100,
  TRACEROUTE = 90,
  SSL_SCANNER = 110,
  HTTP_HEADERS = 120,
  WEBSITE_SCANNER = 170,
  SHARE_POINT_SCANNER = 260,
  WORDPRESS_SCANNER = 270,
  DRUPAL_SCANNER = 280,
  JOOMLA_SCANNER = 290,
  WAF_DETECTOR = 180,
  WEBSITE_RECON = 310,
  NETWORK_SCANNER = 350,
  DOMAIN_FINDER = 390,
  PASSWORD_AUDITOR = 400,
  SSL_SCANNER_ADV = 450,
  SNIPER = 490,
  WAF_DETECTOR_ADV = 500,
  API_SCANNER = 510,
  CLOUD_SCANNER = 520,
  KUBERNETES_SCANNER = 540
}

export enum ScanType {
  LIGHT = 'light',
  DEEP = 'deep',
  CUSTOM = 'custom'
}

export enum ScanStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished'
}

export interface ScanOptions {
  tool_id: SecurityToolId;
  target_name?: string;
  target_id?: number;
  tool_params: Record<string, any>;
  authentication?: {
    type: 'headers';
    headers: string[];
  };
}

export interface ScanResult {
  scan_id: number;
  target_id: number;
  status: ScanStatus;
  progress?: number;
  output?: any;
}

export interface SubdomainFinderParams {
  scan_type: ScanType;
  web_details?: boolean;
  whois?: boolean;
  unresolved_results?: boolean;
}

export interface PortScannerParams {
  scan_type: ScanType;
  protocol?: 'tcp' | 'udp';
  ports?: string;
  os_detection?: boolean;
  service_detection?: boolean;
  traceroute?: boolean;
}

export interface WebsiteScannerParams {
  scan_type: ScanType;
  attack_active?: string[];
  crawl_depth?: number;
  user_agent?: string;
  excluded_paths?: string[];
}

export interface NetworkScannerParams {
  preset: ScanType;
  scanning_engines?: string[];
  ports?: string;
}

export interface APIScannerParams {
  openapi_url: string;
  scan_type?: ScanType;
}

class SecurityScannerService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SECURITY_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('Security Scanner API key not configured');
    }

    this.client = axios.create({
      baseURL: process.env.SECURITY_API_URL || 'https://app.pentest-tools.com/api/v2',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Security Scanner API request', { 
          method: config.method, 
          url: config.url,
          params: config.params 
        });
        return config;
      },
      (error) => {
        logger.error('Security Scanner API request error', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Security Scanner API response', { 
          status: response.status,
          url: response.config.url 
        });
        return response;
      },
      (error) => {
        logger.error('Security Scanner API response error', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  // Target Management
  async createTarget(name: string, description?: string, workspace_id?: number) {
    const response = await this.client.post('/targets', {
      name,
      description,
      workspace_id
    });
    return response.data;
  }

  async getTargets(workspace_id?: number) {
    const params = workspace_id ? { workspace_id } : {};
    const response = await this.client.get('/targets', { params });
    return response.data;
  }

  async getTarget(target_id: number) {
    const response = await this.client.get(`/targets/${target_id}`);
    return response.data;
  }

  // Scan Management
  async startScan(options: ScanOptions) {
    const response = await this.client.post('/scans', options);
    const scan_id = response.data?.data?.created_id;
    
    if (!scan_id) {
      throw new Error('Failed to get scan ID from response');
    }

    return {
      scan_id,
      target_id: response.data?.data?.target_id,
      location: response.headers?.location
    };
  }

  async getScanStatus(scan_id: number): Promise<ScanResult> {
    const response = await this.client.get(`/scans/${scan_id}`);
    const statusName = response.data?.data?.status_name;
    
    // Map API status names to our enum values
    let status: ScanStatus;
    switch (statusName) {
      case 'running':
        status = ScanStatus.IN_PROGRESS;
        break;
      case 'finished':
        status = ScanStatus.FINISHED;
        break;
      case 'waiting':
      case 'queued':
        status = ScanStatus.WAITING;
        break;
      default:
        // For any other status (failed, aborted, etc.), throw error
        throw new Error(`Scan failed with status: ${statusName}`);
    }
    
    return {
      scan_id,
      target_id: response.data?.data?.target_id,
      status,
      progress: response.data?.data?.progress
    };
  }

  async getScanOutput(scan_id: number) {
    const response = await this.client.get(`/scans/${scan_id}/output`);
    return response.data;
  }

  async getScans(workspace_id?: number, target_id?: number) {
    const params: any = {};
    if (workspace_id) params.workspace_id = workspace_id;
    if (target_id) params.target_id = target_id;
    
    const response = await this.client.get('/scans', { params });
    return response.data;
  }

  async stopScan(scan_id: number) {
    const response = await this.client.post(`/scans/${scan_id}/stop`);
    return response.data;
  }

  async deleteScan(scan_id: number) {
    const response = await this.client.delete(`/scans/${scan_id}`);
    return response.data;
  }

  // Specific Scanner Methods
  async startSubdomainScan(target: string, params: SubdomainFinderParams) {
    return this.startScan({
      tool_id: SecurityToolId.SUBDOMAIN_FINDER,
      target_name: target,
      tool_params: params
    });
  }

  async startPortScan(target: string, params: PortScannerParams) {
    const tool_id = params.protocol === 'udp' 
      ? SecurityToolId.UDP_PORT_SCANNER 
      : SecurityToolId.TCP_PORT_SCANNER;

    return this.startScan({
      tool_id,
      target_name: target,
      tool_params: params
    });
  }

  async startWebsiteScan(target: string, params: WebsiteScannerParams, auth?: any) {
    return this.startScan({
      tool_id: SecurityToolId.WEBSITE_SCANNER,
      target_name: target,
      tool_params: params,
      authentication: auth
    });
  }

  async startNetworkScan(target: string, params: NetworkScannerParams) {
    return this.startScan({
      tool_id: SecurityToolId.NETWORK_SCANNER,
      target_name: target,
      tool_params: params
    });
  }

  async startAPIScan(target: string, params: APIScannerParams, auth?: any) {
    return this.startScan({
      tool_id: SecurityToolId.API_SCANNER,
      target_name: target,
      tool_params: params,
      authentication: auth
    });
  }

  async startSSLScan(target: string) {
    return this.startScan({
      tool_id: SecurityToolId.SSL_SCANNER,
      target_name: target,
      tool_params: {}
    });
  }

  async startWAFDetection(target: string) {
    return this.startScan({
      tool_id: SecurityToolId.WAF_DETECTOR,
      target_name: target,
      tool_params: {}
    });
  }

  // CMS Scanners
  async startWordPressScan(target: string, params: any = {}) {
    return this.startScan({
      tool_id: SecurityToolId.WORDPRESS_SCANNER,
      target_name: target,
      tool_params: params
    });
  }

  async startDrupalScan(target: string, params: any = {}) {
    return this.startScan({
      tool_id: SecurityToolId.DRUPAL_SCANNER,
      target_name: target,
      tool_params: params
    });
  }

  async startJoomlaScan(target: string, params: any = {}) {
    return this.startScan({
      tool_id: SecurityToolId.JOOMLA_SCANNER,
      target_name: target,
      tool_params: params
    });
  }

  async startSharePointScan(target: string, params: any = {}) {
    return this.startScan({
      tool_id: SecurityToolId.SHARE_POINT_SCANNER,
      target_name: target,
      tool_params: params
    });
  }

  // DNS & Domain Tools
  async startDNSLookup(target: string, params: any = {}) {
    return this.startScan({
      tool_id: SecurityToolId.DNS_LOOKUP,
      target_name: target,
      tool_params: params
    });
  }

  async startDNSZoneTransfer(target: string, params: any = {}) {
    return this.startScan({
      tool_id: SecurityToolId.DNS_ZONE_TRANSFER,
      target_name: target,
      tool_params: params
    });
  }

  async startWhoisLookup(target: string, params: any = {}) {
    return this.startScan({
      tool_id: SecurityToolId.WHOIS_LOOKUP,
      target_name: target,
      tool_params: params
    });
  }

  async startEmailFinder(target: string, params: any = {}) {
    return this.startScan({
      tool_id: SecurityToolId.EMAIL_FINDER,
      target_name: target,
      tool_params: params
    });
  }

  // Network Tools
  async startPingHost(target: string, params: any = {}) {
    return this.startScan({
      tool_id: SecurityToolId.PING_HOST,
      target_name: target,
      tool_params: params
    });
  }

  async startTraceroute(target: string, params: any = {}) {
    return this.startScan({
      tool_id: SecurityToolId.TRACEROUTE,
      target_name: target,
      tool_params: params
    });
  }

  // Web Application Testing
  async startHTTPHeaders(target: string, params: any = {}) {
    return this.startScan({
      tool_id: SecurityToolId.HTTP_HEADERS,
      target_name: target,
      tool_params: params
    });
  }

  // async startWebsiteScreenshot(target: string, params: any = {}) {
  //   return this.startScan({
  //     tool_id: SecurityToolId.WEBSITE_SCREENSHOT,
  //     target_name: target,
  //     tool_params: params
  //   });
  // }

  async startWebsiteRecon(target: string, params: any = {}) {
    return this.startScan({
      tool_id: SecurityToolId.WEBSITE_RECON,
      target_name: target,
      tool_params: params
    });
  }

  async startURLFuzzer(target: string, params: any = {}) {
    return this.startScan({
      tool_id: SecurityToolId.URL_FUZZER,
      target_name: target,
      tool_params: params
    });
  }

  // Vulnerability Scanners
  // async startXSSScan(target: string, params: any = {}) {
  //   return this.startScan({
  //     tool_id: SecurityToolId.XSS_SCANNER,
  //     target_name: target,
  //     tool_params: params
  //   });
  // }

  // async startSQLiScan(target: string, params: any = {}) {
  //   return this.startScan({
  //     tool_id: SecurityToolId.SQLI_SCANNER,
  //     target_name: target,
  //     tool_params: params
  //   });
  // }

  // async startCORSScan(target: string, params: any = {}) {
  //   return this.startScan({
  //     tool_id: SecurityToolId.CORS_SCANNER,
  //     target_name: target,
  //     tool_params: params
  //   });
  // }

  // Cloud & Advanced
  // async startS3BucketFinder(target: string, params: any = {}) {
  //   return this.startScan({
  //     tool_id: SecurityToolId.S3_BUCKET_FINDER,
  //     target_name: target,
  //     tool_params: params
  //   });
  // }

  // async startSubdomainTakeover(target: string, params: any = {}) {
  //   return this.startScan({
  //     tool_id: SecurityToolId.SUBDOMAIN_TAKEOVER,
  //     target_name: target,
  //     tool_params: params
  //   });
  // }

  // async startGraphQLScan(target: string, params: any = {}) {
  //   return this.startScan({
  //     tool_id: SecurityToolId.GRAPHQL_SCANNER,
  //     target_name: target,
  //     tool_params: params
  //   });
  // }

  // OSINT Tools
  // async startGoogleHacking(target: string, params: any = {}) {
  //   return this.startScan({
  //     tool_id: SecurityToolId.GOOGLE_HACKING,
  //     target_name: target,
  //     tool_params: params
  //   });
  // }

  // async startBreachCheck(target: string, params: any = {}) {
  //   return this.startScan({
  //     tool_id: SecurityToolId.BREACH_CHECK,
  //     target_name: target,
  //     tool_params: params
  //   });
  // }

  // Utility method to wait for scan completion
  async waitForScanCompletion(scan_id: number, pollInterval = 2000): Promise<any> {
    while (true) {
      const status = await this.getScanStatus(scan_id);
      
      if (status.status === ScanStatus.FINISHED) {
        const output = await this.getScanOutput(scan_id);
        return { ...status, output };
      }
      
      if (status.status !== ScanStatus.IN_PROGRESS && status.status !== ScanStatus.WAITING) {
        throw new Error(`Scan failed with status: ${status.status}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
}

export default new SecurityScannerService();