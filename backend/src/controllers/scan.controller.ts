import { Request, Response } from 'express';
import scanService from '../services/scan.service';
import { ScanType } from '../models/scan.model';
import { logger } from '../utils/logger';

// Store free scans in memory (in production, use Redis or database)
const freeScans = new Map<string, any>();

export class ScanController {
  // Get all available scan types and their options
  async getScanTypes(req: Request, res: Response) {
    const scanTypes = [
      {
        id: ScanType.SUBDOMAIN,
        name: 'Subdomain Discovery',
        description: 'Discover subdomains for a given domain',
        parameters: {
          scan_type: { type: 'select', options: ['light', 'deep', 'custom'], default: 'deep' },
          web_details: { type: 'boolean', default: true, description: 'Extract web server information' },
          whois: { type: 'boolean', default: false, description: 'Extract whois information' },
          unresolved_results: { type: 'boolean', default: false, description: 'Include unresolved subdomains' }
        }
      },
      {
        id: ScanType.PORT_SCAN,
        name: 'Port Scanner',
        description: 'Scan TCP/UDP ports on target systems',
        parameters: {
          scan_type: { type: 'select', options: ['light', 'deep', 'custom'], default: 'deep' },
          protocol: { type: 'select', options: ['tcp', 'udp'], default: 'tcp' },
          ports: { type: 'text', description: 'Custom port range (e.g., 1-1000)', required: false },
          os_detection: { type: 'boolean', default: false },
          service_detection: { type: 'boolean', default: true },
          traceroute: { type: 'boolean', default: false }
        }
      },
      {
        id: ScanType.WEBSITE,
        name: 'Website Scanner',
        description: 'Comprehensive web application vulnerability scanner',
        parameters: {
          scan_type: { type: 'select', options: ['light', 'deep', 'custom'], default: 'deep' },
          attack_active: {
            type: 'multiselect',
            options: ['xss', 'sqli', 'lfi', 'oscmdi', 'ssrf', 'open_redirect', 'broken_authentication', 'xxe'],
            default: ['xss', 'sqli', 'lfi']
          },
          crawl_depth: { type: 'number', default: 3, min: 1, max: 10 },
          user_agent: { type: 'text', required: false },
          excluded_paths: { type: 'array', required: false, description: 'Paths to exclude from scanning' }
        }
      },
      {
        id: ScanType.NETWORK,
        name: 'Network Scanner',
        description: 'Comprehensive network vulnerability assessment',
        parameters: {
          preset: { type: 'select', options: ['light', 'deep', 'custom'], default: 'deep' },
          scanning_engines: {
            type: 'multiselect',
            options: ['version_based', 'sniper', 'nuclei', 'openvas'],
            default: ['version_based', 'sniper', 'nuclei']
          },
          ports: { type: 'text', description: 'Custom port range', required: false }
        }
      },
      {
        id: ScanType.API,
        name: 'API Scanner',
        description: 'Test REST API endpoints for vulnerabilities',
        parameters: {
          openapi_url: { type: 'text', required: true, description: 'URL to OpenAPI/Swagger specification' },
          scan_type: { type: 'select', options: ['light', 'deep', 'custom'], default: 'deep' }
        }
      },
      {
        id: ScanType.SSL,
        name: 'SSL/TLS Scanner',
        description: 'Test SSL/TLS configuration and vulnerabilities',
        parameters: {}
      },
      {
        id: ScanType.WAF,
        name: 'WAF Detector',
        description: 'Detect Web Application Firewalls',
        parameters: {}
      },
      // CMS Scanners
      {
        id: ScanType.WORDPRESS,
        name: 'WordPress Scanner',
        description: 'Scan WordPress sites for vulnerabilities and misconfigurations',
        parameters: {
          scan_type: { type: 'select', options: ['light', 'deep', 'custom'], default: 'deep' },
          enumerate_users: { type: 'boolean', default: true, description: 'Enumerate WordPress users' },
          enumerate_plugins: { type: 'boolean', default: true, description: 'Enumerate installed plugins' },
          enumerate_themes: { type: 'boolean', default: true, description: 'Enumerate installed themes' },
          check_vulnerabilities: { type: 'boolean', default: true, description: 'Check for known vulnerabilities' }
        }
      },
      {
        id: ScanType.DRUPAL,
        name: 'Drupal Scanner',
        description: 'Scan Drupal sites for vulnerabilities and security issues',
        parameters: {
          scan_type: { type: 'select', options: ['light', 'deep', 'custom'], default: 'deep' },
          enumerate_users: { type: 'boolean', default: true, description: 'Enumerate Drupal users' },
          enumerate_modules: { type: 'boolean', default: true, description: 'Enumerate installed modules' },
          enumerate_themes: { type: 'boolean', default: true, description: 'Enumerate installed themes' },
          check_vulnerabilities: { type: 'boolean', default: true, description: 'Check for known vulnerabilities' }
        }
      },
      {
        id: ScanType.JOOMLA,
        name: 'Joomla Scanner',
        description: 'Scan Joomla sites for vulnerabilities and security weaknesses',
        parameters: {
          scan_type: { type: 'select', options: ['light', 'deep', 'custom'], default: 'deep' },
          enumerate_users: { type: 'boolean', default: true, description: 'Enumerate Joomla users' },
          enumerate_components: { type: 'boolean', default: true, description: 'Enumerate installed components' },
          enumerate_plugins: { type: 'boolean', default: true, description: 'Enumerate installed plugins' },
          check_vulnerabilities: { type: 'boolean', default: true, description: 'Check for known vulnerabilities' }
        }
      },
      {
        id: ScanType.MAGENTO,
        name: 'Magento Scanner',
        description: 'Scan Magento e-commerce sites for security issues',
        parameters: {
          scan_type: { type: 'select', options: ['light', 'deep', 'custom'], default: 'deep' },
          check_admin_panel: { type: 'boolean', default: true, description: 'Check for exposed admin panel' },
          enumerate_extensions: { type: 'boolean', default: true, description: 'Enumerate installed extensions' },
          check_vulnerabilities: { type: 'boolean', default: true, description: 'Check for known vulnerabilities' },
          check_patches: { type: 'boolean', default: true, description: 'Check for missing security patches' }
        }
      },
      {
        id: ScanType.SHAREPOINT,
        name: 'SharePoint Scanner',
        description: 'Scan Microsoft SharePoint sites for security issues',
        parameters: {
          scan_type: { type: 'select', options: ['light', 'deep', 'custom'], default: 'deep' },
          enumerate_users: { type: 'boolean', default: true, description: 'Enumerate SharePoint users' },
          enumerate_lists: { type: 'boolean', default: true, description: 'Enumerate SharePoint lists' },
          check_permissions: { type: 'boolean', default: true, description: 'Check for permission issues' },
          check_vulnerabilities: { type: 'boolean', default: true, description: 'Check for known vulnerabilities' }
        }
      },
      // DNS & Domain
      {
        id: ScanType.DNS_LOOKUP,
        name: 'DNS Lookup',
        description: 'Perform comprehensive DNS lookups and record enumeration',
        parameters: {
          record_types: {
            type: 'multiselect',
            options: ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA', 'PTR', 'SRV'],
            default: ['A', 'AAAA', 'MX', 'TXT', 'NS'],
            description: 'DNS record types to query'
          },
          resolve_subdomains: { type: 'boolean', default: false, description: 'Resolve discovered subdomains' },
          check_dnssec: { type: 'boolean', default: true, description: 'Check DNSSEC configuration' }
        }
      },
      {
        id: ScanType.DNS_ZONE_TRANSFER,
        name: 'DNS Zone Transfer',
        description: 'Attempt DNS zone transfer to discover all records',
        parameters: {
          nameservers: { type: 'array', required: false, description: 'Custom nameservers to test (optional)' },
          verify_results: { type: 'boolean', default: true, description: 'Verify discovered records' }
        }
      },
      {
        id: ScanType.WHOIS_LOOKUP,
        name: 'WHOIS Lookup',
        description: 'Perform WHOIS lookup to gather domain registration information',
        parameters: {
          include_history: { type: 'boolean', default: false, description: 'Include historical WHOIS data' },
          check_related_domains: { type: 'boolean', default: false, description: 'Check for related domains' }
        }
      },
      {
        id: ScanType.EMAIL_FINDER,
        name: 'Email Finder',
        description: 'Discover email addresses associated with a domain',
        parameters: {
          search_engines: {
            type: 'multiselect',
            options: ['google', 'bing', 'hunter', 'emailhunter', 'voilanorbert'],
            default: ['google', 'bing'],
            description: 'Search engines to use'
          },
          verify_emails: { type: 'boolean', default: true, description: 'Verify discovered email addresses' },
          check_breaches: { type: 'boolean', default: false, description: 'Check emails in data breaches' }
        }
      },
      // Network
      {
        id: ScanType.PING_HOST,
        name: 'Ping Host',
        description: 'Check host availability using ICMP ping',
        parameters: {
          count: { type: 'number', default: 4, min: 1, max: 100, description: 'Number of ping attempts' },
          timeout: { type: 'number', default: 5, min: 1, max: 30, description: 'Timeout in seconds' },
          packet_size: { type: 'number', default: 56, min: 8, max: 65500, description: 'Packet size in bytes' }
        }
      },
      {
        id: ScanType.TRACEROUTE,
        name: 'Traceroute',
        description: 'Trace network path to target host',
        parameters: {
          max_hops: { type: 'number', default: 30, min: 1, max: 255, description: 'Maximum number of hops' },
          protocol: { type: 'select', options: ['icmp', 'udp', 'tcp'], default: 'icmp' },
          resolve_hostnames: { type: 'boolean', default: true, description: 'Resolve IP addresses to hostnames' }
        }
      },
      // Web App
      {
        id: ScanType.HTTP_HEADERS,
        name: 'HTTP Headers Analysis',
        description: 'Analyze HTTP headers for security issues',
        parameters: {
          check_security_headers: { type: 'boolean', default: true, description: 'Check for security headers' },
          check_server_info: { type: 'boolean', default: true, description: 'Check for server information disclosure' },
          follow_redirects: { type: 'boolean', default: true, description: 'Follow HTTP redirects' },
          custom_headers: { type: 'object', required: false, description: 'Custom headers to send' }
        }
      },
      {
        id: ScanType.WEBSITE_SCREENSHOT,
        name: 'Website Screenshot',
        description: 'Capture screenshots of web pages',
        parameters: {
          viewport_width: { type: 'number', default: 1920, min: 320, max: 3840, description: 'Viewport width' },
          viewport_height: { type: 'number', default: 1080, min: 240, max: 2160, description: 'Viewport height' },
          full_page: { type: 'boolean', default: false, description: 'Capture full page screenshot' },
          wait_time: { type: 'number', default: 3, min: 0, max: 30, description: 'Wait time before capture (seconds)' }
        }
      },
      {
        id: ScanType.WEBSITE_RECON,
        name: 'Website Reconnaissance',
        description: 'Perform comprehensive website reconnaissance',
        parameters: {
          technologies: { type: 'boolean', default: true, description: 'Detect technologies used' },
          metadata: { type: 'boolean', default: true, description: 'Extract metadata' },
          sitemap: { type: 'boolean', default: true, description: 'Check for sitemap' },
          robots_txt: { type: 'boolean', default: true, description: 'Analyze robots.txt' },
          social_links: { type: 'boolean', default: true, description: 'Find social media links' }
        }
      },
      {
        id: ScanType.URL_FUZZER,
        name: 'URL Fuzzer',
        description: 'Discover hidden files and directories',
        parameters: {
          wordlist: { type: 'select', options: ['small', 'medium', 'large', 'custom'], default: 'medium' },
          extensions: { type: 'array', default: ['.php', '.html', '.js', '.txt', '.bak'], description: 'File extensions to test' },
          threads: { type: 'number', default: 10, min: 1, max: 50, description: 'Number of concurrent threads' },
          follow_redirects: { type: 'boolean', default: false, description: 'Follow redirects' }
        }
      },
      // Vulnerability
      {
        id: ScanType.XSS,
        name: 'XSS Scanner',
        description: 'Test for Cross-Site Scripting vulnerabilities',
        parameters: {
          scan_type: { type: 'select', options: ['light', 'deep', 'custom'], default: 'deep' },
          test_forms: { type: 'boolean', default: true, description: 'Test form inputs' },
          test_urls: { type: 'boolean', default: true, description: 'Test URL parameters' },
          test_headers: { type: 'boolean', default: true, description: 'Test HTTP headers' },
          payload_types: {
            type: 'multiselect',
            options: ['basic', 'advanced', 'dom_based', 'stored'],
            default: ['basic', 'advanced']
          }
        }
      },
      {
        id: ScanType.SQLI,
        name: 'SQL Injection Scanner',
        description: 'Test for SQL Injection vulnerabilities',
        parameters: {
          scan_type: { type: 'select', options: ['light', 'deep', 'custom'], default: 'deep' },
          test_forms: { type: 'boolean', default: true, description: 'Test form inputs' },
          test_urls: { type: 'boolean', default: true, description: 'Test URL parameters' },
          test_cookies: { type: 'boolean', default: true, description: 'Test cookies' },
          database_types: {
            type: 'multiselect',
            options: ['mysql', 'postgresql', 'mssql', 'oracle', 'sqlite'],
            default: ['mysql', 'postgresql']
          }
        }
      },
      {
        id: ScanType.CORS,
        name: 'CORS Misconfiguration Scanner',
        description: 'Check for CORS misconfigurations',
        parameters: {
          test_origins: { type: 'array', default: ['null', 'https://evil.com'], description: 'Origins to test' },
          check_credentials: { type: 'boolean', default: true, description: 'Check credentials handling' },
          check_methods: { type: 'boolean', default: true, description: 'Check allowed methods' }
        }
      },
      // Cloud
      {
        id: ScanType.S3_BUCKET,
        name: 'S3 Bucket Scanner',
        description: 'Find and test AWS S3 buckets for misconfigurations',
        parameters: {
          wordlist: { type: 'select', options: ['small', 'medium', 'large'], default: 'medium' },
          check_permissions: { type: 'boolean', default: true, description: 'Check bucket permissions' },
          list_files: { type: 'boolean', default: true, description: 'Attempt to list bucket contents' },
          check_upload: { type: 'boolean', default: false, description: 'Test upload permissions' }
        }
      },
      {
        id: ScanType.SUBDOMAIN_TAKEOVER,
        name: 'Subdomain Takeover Scanner',
        description: 'Check for subdomain takeover vulnerabilities',
        parameters: {
          check_cname: { type: 'boolean', default: true, description: 'Check CNAME records' },
          service_fingerprinting: { type: 'boolean', default: true, description: 'Fingerprint services' },
          verify_takeover: { type: 'boolean', default: false, description: 'Attempt to verify takeover possibility' }
        }
      },
      // API
      {
        id: ScanType.GRAPHQL,
        name: 'GraphQL Scanner',
        description: 'Test GraphQL endpoints for vulnerabilities',
        parameters: {
          introspection: { type: 'boolean', default: true, description: 'Test introspection queries' },
          field_suggestions: { type: 'boolean', default: true, description: 'Test field suggestions' },
          batch_queries: { type: 'boolean', default: true, description: 'Test batch query attacks' },
          depth_limit: { type: 'number', default: 10, min: 1, max: 50, description: 'Maximum query depth to test' }
        }
      },
      // OSINT
      {
        id: ScanType.GOOGLE_HACKING,
        name: 'Google Hacking',
        description: 'Use Google dorks to find sensitive information',
        parameters: {
          dork_categories: {
            type: 'multiselect',
            options: ['files', 'login_pages', 'exposed_data', 'error_messages', 'vulnerable_servers'],
            default: ['files', 'login_pages', 'exposed_data'],
            description: 'Categories of Google dorks to use'
          },
          max_results: { type: 'number', default: 100, min: 10, max: 500, description: 'Maximum results to retrieve' },
          check_cache: { type: 'boolean', default: true, description: 'Check Google cache' }
        }
      },
      {
        id: ScanType.BREACH_CHECK,
        name: 'Data Breach Check',
        description: 'Check if domain or emails appear in data breaches',
        parameters: {
          check_domain: { type: 'boolean', default: true, description: 'Check domain in breaches' },
          check_emails: { type: 'boolean', default: true, description: 'Check discovered emails' },
          breach_sources: {
            type: 'multiselect',
            options: ['haveibeenpwned', 'dehashed', 'leakcheck', 'snusbase'],
            default: ['haveibeenpwned'],
            description: 'Breach databases to check'
          }
        }
      }
    ];

    res.json({ data: scanTypes });
  }

  // Create a new scan (public endpoint - no auth required for viewing options)
  async createScan(req: Request, res: Response) {
    try {
      const { target, type, parameters } = req.body;
      
      // Validate required fields
      if (!target || !type) {
        return res.status(400).json({
          error: 'Missing required fields: target and type'
        });
      }

      // Validate scan type
      if (!Object.values(ScanType).includes(type)) {
        return res.status(400).json({
          error: `Invalid scan type. Valid types: ${Object.values(ScanType).join(', ')}`
        });
      }

      // Create scan with optional user association
      const scan = await scanService.createScan({
        target,
        type,
        parameters: parameters || {},
        userId: (req as any).user?.id // Will be undefined for unauthenticated users
      });

      res.status(201).json({
        data: scan,
        message: 'Scan created successfully'
      });
    } catch (error: any) {
      logger.error('Failed to create scan', { error });
      res.status(500).json({
        error: 'Failed to create scan',
        message: error.message
      });
    }
  }

  // Get scan by ID (public for anonymous scans, filtered for authenticated users)
  async getScan(req: Request, res: Response) {
    try {
      const scanId = parseInt(req.params.id);
      const scan = await scanService.getScan(scanId);

      if (!scan) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      // If user is authenticated, only show their scans
      if ((req as any).user && scan.user && scan.user.id !== (req as any).user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ data: scan });
    } catch (error: any) {
      logger.error('Failed to get scan', { error });
      res.status(500).json({
        error: 'Failed to get scan',
        message: error.message
      });
    }
  }

  // Get all scans (requires authentication)
  async getAllScans(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      
      // If user is authenticated, show only their scans
      const scans = userId 
        ? await scanService.getUserScans(userId)
        : await scanService.getAllScans();

      res.json({ data: scans });
    } catch (error: any) {
      logger.error('Failed to get scans', { error });
      res.status(500).json({
        error: 'Failed to get scans',
        message: error.message
      });
    }
  }

  // Cancel a scan
  async cancelScan(req: Request, res: Response) {
    try {
      const scanId = parseInt(req.params.id);
      const scan = await scanService.getScan(scanId);

      if (!scan) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      // Check ownership if user is authenticated
      if ((req as any).user && scan.user && scan.user.id !== (req as any).user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await scanService.cancelScan(scanId);
      res.json({ message: 'Scan cancelled successfully' });
    } catch (error: any) {
      logger.error('Failed to cancel scan', { error });
      res.status(500).json({
        error: 'Failed to cancel scan',
        message: error.message
      });
    }
  }

  // Delete a scan
  async deleteScan(req: Request, res: Response) {
    try {
      const scanId = parseInt(req.params.id);
      const scan = await scanService.getScan(scanId);

      if (!scan) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      // Check ownership if user is authenticated
      if ((req as any).user && scan.user && scan.user.id !== (req as any).user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await scanService.deleteScan(scanId);
      res.json({ message: 'Scan deleted successfully' });
    } catch (error: any) {
      logger.error('Failed to delete scan', { error });
      res.status(500).json({
        error: 'Failed to delete scan',
        message: error.message
      });
    }
  }

  // Create a free scan (SSL only, no auth required)
  async createFreeScan(req: Request, res: Response) {
    try {
      const { target } = req.body;
      
      if (!target) {
        return res.status(400).json({ error: 'Target URL is required' });
      }

      // Validate URL
      try {
        new URL(target);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      // Free scans are limited to SSL checks
      const scanData = {
        target,
        type: ScanType.SSL,
        parameters: {},
        // No userId for free scans
      };

      const scan = await scanService.createScan(scanData);
      
      // Store in memory for retrieval
      freeScans.set(scan.id.toString(), scan);

      res.status(201).json({
        success: true,
        data: {
          id: scan.id,
          target: scan.target,
          type: scan.type,
          status: scan.status,
          progress: scan.progress
        }
      });
    } catch (error: any) {
      logger.error('Failed to create free scan', { error });
      res.status(500).json({
        error: 'Failed to create scan',
        message: error.message
      });
    }
  }

  // Get free scan status (no auth required)
  async getFreeScan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // First check memory
      let scan = freeScans.get(id);
      
      // If not in memory, try to get from service
      if (!scan) {
        scan = await scanService.getScan(parseInt(id));
      }
      
      if (!scan) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      // Only return limited data for free scans
      res.json({
        success: true,
        data: {
          id: scan.id,
          target: scan.target,
          type: scan.type,
          status: scan.status,
          progress: scan.progress,
          results: scan.results,
          error_message: scan.error_message,
          created_at: scan.created_at,
          completed_at: scan.completed_at
        }
      });
    } catch (error: any) {
      logger.error('Failed to get free scan', { error });
      res.status(500).json({
        error: 'Failed to get scan',
        message: error.message
      });
    }
  }
}

export default new ScanController();