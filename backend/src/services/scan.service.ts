import { Scan, ScanStatus, ScanType } from '../models/scan.model';
import { ScanResult, ResultSeverity } from '../models/scanResult.model';
import securityScannerService, { SecurityToolId, ScanType as PTScanType } from './security-scanner.service';
import orderService from './order.service';
import { logger } from '../utils/logger';
import { getRedis } from '../config/redis';
import { AppDataSource } from '../config/typeorm';

interface CreateScanDto {
  target: string;
  type: ScanType;
  parameters: Record<string, any>;
  userId?: number;
}

interface ScanProgress {
  scanId: number;
  progress: number;
  status: ScanStatus;
  message?: string;
}

class ScanService {
  private get scanRepository() {
    if (process.env.SKIP_DB === 'true') {
      throw new Error('Database is required - cannot run without database');
    }
    return AppDataSource.getRepository(Scan);
  }
  
  private get scanResultRepository() {
    if (process.env.SKIP_DB === 'true') {
      throw new Error('Database is required - cannot run without database');
    }
    return AppDataSource.getRepository(ScanResult);
  }

  async createScan(data: CreateScanDto): Promise<Scan> {
    // Check if user has available scans (skip for free/demo scans)
    // TEMPORARILY DISABLED FOR TESTING - REMOVE IN PRODUCTION
    /*
    if (data.userId && data.type !== ScanType.SSL && data.type !== ScanType.DNS_LOOKUP) {
      try {
        const orderItem = await orderService.consumeScan(data.userId, data.type);
        logger.info('Scan consumed from order', { 
          userId: data.userId, 
          scanType: data.type,
          orderItemId: orderItem.id 
        });
      } catch (error) {
        logger.error('Failed to consume scan from order', { error });
        throw new Error('No available scans. Please purchase a scan package.');
      }
    }
    */

    const scan = this.scanRepository!.create({
      target: data.target,
      type: data.type,
      parameters: data.parameters,
      status: ScanStatus.PENDING,
      user: data.userId ? { id: data.userId } : undefined,
      // Note: order_item relationship is set separately when consuming scan
    });

    await this.scanRepository!.save(scan);
    
    // Start the scan asynchronously
    this.executeScan(scan.id).catch(error => {
      logger.error('Failed to execute scan', { scanId: scan.id, error });
    });

    return scan;
  }

  async getScan(id: number): Promise<Scan | undefined> {
    const result = await this.scanRepository!.findOne({
      where: { id },
      relations: ['results', 'user']
    });
    return result || undefined;
  }

  async getUserScans(userId: number): Promise<Scan[]> {
    return this.scanRepository!.find({
      where: { user: { id: userId } },
      order: { created_at: 'DESC' },
      relations: ['results']
    });
  }

  async getAllScans(): Promise<Scan[]> {
    return this.scanRepository!.find({
      order: { created_at: 'DESC' },
      relations: ['results', 'user']
    });
  }

  async updateScanProgress(scanId: number, progress: number, status?: ScanStatus) {
    const update: any = { progress };
    if (status) update.status = status;
    
    await this.scanRepository!.update(scanId, update);
    
    // Publish progress for real-time updates
    const progressData: ScanProgress = {
      scanId,
      progress,
      status: status || ScanStatus.RUNNING
    };
    
    try {
      // Use in-memory pub/sub
      const redis = getRedis();
      await redis.publish('scan-progress', JSON.stringify(progressData));
    } catch (error) {
      logger.warn('Failed to publish progress update', error);
    }
  }

  private async executeScan(scanId: number) {
    const scan = await this.scanRepository!.findOne({ where: { id: scanId } });
    
    if (!scan) {
      logger.error('Scan not found', { scanId });
      return;
    }

    try {
      // Update scan status to running
      scan.status = ScanStatus.RUNNING;
      scan.started_at = new Date();
      await this.scanRepository!.save(scan);

      // Always use real Pentest-tools scanner
      logger.info('Starting Pentest-tools scan', { scanId, type: scan.type });
      
      // Start the appropriate PentestTools scan
      const ptScanResult = await this.startPentestToolsScan(scan);
      
      scan.pentest_tools_scan_id = ptScanResult.scan_id;
      scan.pentest_tools_target_id = ptScanResult.target_id;
      await this.scanRepository!.save(scan);

      // Poll for scan completion
      const result = await securityScannerService.waitForScanCompletion(
        ptScanResult.scan_id,
        5000 // Poll every 5 seconds
      );

      // Process and save results
      await this.processScanResults(scan, result.output);

      // Update scan status
      scan.status = ScanStatus.COMPLETED;
      scan.completed_at = new Date();
      scan.progress = 100;
      
      await this.scanRepository!.save(scan);
      await this.updateScanProgress(scanId, 100, ScanStatus.COMPLETED);

    } catch (error: any) {
      logger.error('Scan execution failed', { scanId, error });
      
      scan.status = ScanStatus.FAILED;
      scan.error_message = error.message;
      scan.completed_at = new Date();
      
      await this.scanRepository!.save(scan);
      await this.updateScanProgress(scanId, scan.progress, ScanStatus.FAILED);
    }
  }

  private async startPentestToolsScan(scan: Scan) {
    switch (scan.type) {
      case ScanType.SUBDOMAIN:
        return securityScannerService.startSubdomainScan(scan.target, {
          scan_type: scan.parameters.scan_type || PTScanType.DEEP,
          web_details: scan.parameters.web_details !== false,
          whois: scan.parameters.whois || false,
          unresolved_results: scan.parameters.unresolved_results || false
        });

      case ScanType.PORT_SCAN:
        return securityScannerService.startPortScan(scan.target, {
          scan_type: scan.parameters.scan_type || PTScanType.DEEP,
          protocol: scan.parameters.protocol || 'tcp',
          ports: scan.parameters.ports,
          os_detection: scan.parameters.os_detection || false,
          service_detection: scan.parameters.service_detection !== false,
          traceroute: scan.parameters.traceroute || false
        });

      case ScanType.WEBSITE:
        return securityScannerService.startWebsiteScan(scan.target, {
          scan_type: scan.parameters.scan_type || PTScanType.DEEP,
          attack_active: scan.parameters.attack_active || ['xss', 'sqli', 'lfi'],
          crawl_depth: scan.parameters.crawl_depth,
          user_agent: scan.parameters.user_agent,
          excluded_paths: scan.parameters.excluded_paths
        });

      case ScanType.NETWORK:
        return securityScannerService.startNetworkScan(scan.target, {
          preset: scan.parameters.preset || PTScanType.DEEP,
          scanning_engines: scan.parameters.scanning_engines || ['version_based', 'sniper', 'nuclei'],
          ports: scan.parameters.ports
        });

      case ScanType.API:
        return securityScannerService.startAPIScan(scan.target, {
          openapi_url: scan.parameters.openapi_url,
          scan_type: scan.parameters.scan_type || PTScanType.DEEP
        });

      case ScanType.SSL:
        return securityScannerService.startSSLScan(scan.target);

      case ScanType.WAF:
        return securityScannerService.startWAFDetection(scan.target);

      // CMS Scanners
      case ScanType.WORDPRESS:
        const wpParams: any = {
          scan_type: scan.parameters.scan_type || PTScanType.DEEP
        };
        
        // Only add enumerate if scan_type is custom
        if (scan.parameters.scan_type === 'custom') {
          const enumerate = [];
          if (scan.parameters.enumerate_users) enumerate.push('users');
          if (scan.parameters.enumerate_plugins) enumerate.push('plugins');
          if (scan.parameters.enumerate_themes) enumerate.push('themes');
          if (enumerate.length > 0) {
            wpParams.enumerate = enumerate;
          }
        }
        
        return securityScannerService.startWordPressScan(scan.target, wpParams);

      case ScanType.DRUPAL:
        return securityScannerService.startDrupalScan(scan.target, {
          scan_type: scan.parameters.scan_type || PTScanType.DEEP
        });

      case ScanType.JOOMLA:
        return securityScannerService.startJoomlaScan(scan.target, {
          scan_type: scan.parameters.scan_type || PTScanType.DEEP
        });

      // case ScanType.MAGENTO:
      //   return securityScannerService.startMagentoScan(scan.target, scan.parameters);

      case ScanType.SHAREPOINT:
        return securityScannerService.startSharePointScan(scan.target, scan.parameters);

      // DNS & Domain Tools
      case ScanType.DNS_LOOKUP:
        return securityScannerService.startDNSLookup(scan.target, scan.parameters);

      case ScanType.DNS_ZONE_TRANSFER:
        return securityScannerService.startDNSZoneTransfer(scan.target, scan.parameters);

      case ScanType.WHOIS_LOOKUP:
        return securityScannerService.startWhoisLookup(scan.target, scan.parameters);

      case ScanType.EMAIL_FINDER:
        return securityScannerService.startEmailFinder(scan.target, scan.parameters);

      // Network Tools
      case ScanType.PING_HOST:
        return securityScannerService.startPingHost(scan.target, scan.parameters);

      case ScanType.TRACEROUTE:
        return securityScannerService.startTraceroute(scan.target, scan.parameters);

      // Web Application Testing
      case ScanType.HTTP_HEADERS:
        return securityScannerService.startHTTPHeaders(scan.target, scan.parameters);

      // case ScanType.WEBSITE_SCREENSHOT:
      //   return securityScannerService.startWebsiteScreenshot(scan.target, scan.parameters);

      case ScanType.WEBSITE_RECON:
        return securityScannerService.startWebsiteRecon(scan.target, scan.parameters);

      case ScanType.URL_FUZZER:
        return securityScannerService.startURLFuzzer(scan.target, scan.parameters);

      // Vulnerability Scanners
      // case ScanType.XSS:
      //   return securityScannerService.startXSSScan(scan.target, scan.parameters);

      // case ScanType.SQLI:
      //   return securityScannerService.startSQLiScan(scan.target, scan.parameters);

      // case ScanType.CORS:
      //   return securityScannerService.startCORSScan(scan.target, scan.parameters);

      // Cloud & Advanced
      // case ScanType.S3_BUCKET:
      //   return securityScannerService.startS3BucketFinder(scan.target, scan.parameters);

      // case ScanType.SUBDOMAIN_TAKEOVER:
      //   return securityScannerService.startSubdomainTakeover(scan.target, scan.parameters);

      // case ScanType.GRAPHQL:
      //   return securityScannerService.startGraphQLScan(scan.target, scan.parameters);

      // OSINT Tools
      // case ScanType.GOOGLE_HACKING:
      //   return securityScannerService.startGoogleHacking(scan.target, scan.parameters);

      // case ScanType.BREACH_CHECK:
      //   return securityScannerService.startBreachCheck(scan.target, scan.parameters);

      default:
        throw new Error(`Unsupported scan type: ${scan.type}`);
    }
  }

  private async processScanResults(scan: Scan, output: any) {
    if (!output || !output.data) {
      logger.warn('No scan output data', { scanId: scan.id });
      return;
    }

    const results = this.parseScanOutput(scan.type as ScanType, output.data);
    
    for (const result of results) {
      const scanResult = this.scanResultRepository!.create({
        scan,
        ...result
      });
      await this.scanResultRepository!.save(scanResult);
    }
    
    // Store raw output in metadata
    scan.metadata = { raw_output: output };
    await this.scanRepository!.save(scan);
  }

  private parseScanOutput(scanType: ScanType, data: any): Partial<ScanResult>[] {
    const results: Partial<ScanResult>[] = [];

    switch (scanType) {
      case ScanType.SUBDOMAIN:
        if (data.subdomains) {
          for (const subdomain of data.subdomains) {
            results.push({
              type: 'subdomain',
              title: subdomain.name,
              description: `Found subdomain: ${subdomain.name}`,
              severity: ResultSeverity.INFO,
              details: subdomain,
              affected_component: subdomain.name
            });
          }
        }
        break;

      case ScanType.PORT_SCAN:
        if (data.ports) {
          for (const port of data.ports) {
            if (port.state === 'open') {
              results.push({
                type: 'open_port',
                title: `Open port ${port.port}/${port.protocol}`,
                description: `Service: ${port.service || 'unknown'}`,
                severity: this.getPortSeverity(port.port),
                details: port,
                affected_component: `${port.port}/${port.protocol}`
              });
            }
          }
        }
        break;

      case ScanType.WEBSITE:
        if (data.vulnerabilities) {
          for (const vuln of data.vulnerabilities) {
            results.push({
              type: 'vulnerability',
              title: vuln.name,
              description: vuln.description,
              severity: this.mapVulnSeverity(vuln.severity),
              details: vuln,
              affected_component: vuln.url || vuln.parameter,
              recommendation: vuln.recommendation,
              references: vuln.references,
              cve_id: vuln.cve,
              cvss_score: vuln.cvss
            });
          }
        }
        break;

      case ScanType.SSL:
        if (data.issues) {
          for (const issue of data.issues) {
            results.push({
              type: 'ssl_issue',
              title: issue.title,
              description: issue.description,
              severity: this.mapVulnSeverity(issue.severity),
              details: issue,
              affected_component: 'SSL/TLS Configuration',
              recommendation: issue.fix
            });
          }
        }
        break;

      default:
        // Generic result parsing
        results.push({
          type: 'scan_result',
          title: `${scanType} scan completed`,
          description: 'Scan completed successfully',
          severity: ResultSeverity.INFO,
          details: data
        });
    }

    return results;
  }

  private getPortSeverity(port: number): ResultSeverity {
    const highRiskPorts = [22, 23, 445, 3389, 1433, 3306, 5432];
    const mediumRiskPorts = [21, 25, 110, 143, 161, 389, 636];
    
    if (highRiskPorts.includes(port)) return ResultSeverity.HIGH;
    if (mediumRiskPorts.includes(port)) return ResultSeverity.MEDIUM;
    return ResultSeverity.LOW;
  }

  private mapVulnSeverity(severity: string): ResultSeverity {
    switch (severity?.toLowerCase()) {
      case 'critical': return ResultSeverity.CRITICAL;
      case 'high': return ResultSeverity.HIGH;
      case 'medium': return ResultSeverity.MEDIUM;
      case 'low': return ResultSeverity.LOW;
      default: return ResultSeverity.INFO;
    }
  }

  async cancelScan(scanId: number): Promise<void> {
    const scan = await this.scanRepository!.findOne({ where: { id: scanId } });
    if (!scan) throw new Error('Scan not found');

    if (scan.pentest_tools_scan_id) {
      await securityScannerService.stopScan(scan.pentest_tools_scan_id);
    }

    scan.status = ScanStatus.CANCELLED;
    scan.completed_at = new Date();
    await this.scanRepository!.save(scan);
  }

  async deleteScan(scanId: number): Promise<void> {
    const scan = await this.scanRepository!.findOne({ where: { id: scanId } });
    if (!scan) throw new Error('Scan not found');

    if (scan.pentest_tools_scan_id) {
      await securityScannerService.deleteScan(scan.pentest_tools_scan_id);
    }

    await this.scanResultRepository!.delete({ scan: { id: scanId } });
    await this.scanRepository!.delete(scanId);
  }

  async updateScanWithResults(scanId: number, updateData: {
    status?: ScanStatus;
    results?: any[];
    completed_at?: string;
  }): Promise<Scan> {
    const scan = await this.scanRepository!.findOne({ 
      where: { id: scanId },
      relations: ['results']
    });
    
    if (!scan) throw new Error('Scan not found');

    // Update scan properties
    if (updateData.status) {
      scan.status = updateData.status;
    }
    if (updateData.completed_at) {
      scan.completed_at = new Date(updateData.completed_at);
    }
    if (updateData.status === ScanStatus.COMPLETED) {
      scan.progress = 100;
    }

    // Save scan updates
    await this.scanRepository!.save(scan);

    // Add results if provided
    if (updateData.results && updateData.results.length > 0) {
      // Clear existing results
      await this.scanResultRepository!.delete({ scan: { id: scanId } });

      // Add new results
      for (const resultData of updateData.results) {
        const scanResult = this.scanResultRepository!.create({
          scan: scan,
          type: resultData.category || 'General',
          title: resultData.title || 'Security Finding',
          description: resultData.description || '',
          severity: this.mapVulnSeverity(resultData.severity),
          details: resultData,
          recommendation: resultData.solution || null
        });
        await this.scanResultRepository!.save(scanResult);
      }
    }

    // Return updated scan with results
    return await this.scanRepository!.findOne({
      where: { id: scanId },
      relations: ['results']
    }) as Scan;
  }
}

export default new ScanService();