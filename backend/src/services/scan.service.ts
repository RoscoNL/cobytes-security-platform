import { Scan, ScanStatus, ScanType } from '../models/scan.model';
import { ScanResult, ResultSeverity } from '../models/scanResult.model';
import pentestToolsService, { PentestToolId, ScanType as PTScanType } from './pentesttools.service';
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
  private mockScans: Map<number, any> = new Map();
  private nextId = 1;

  private get scanRepository() {
    if (process.env.SKIP_DB === 'true') {
      return null;
    }
    return AppDataSource.getRepository(Scan);
  }
  
  private get scanResultRepository() {
    if (process.env.SKIP_DB === 'true') {
      return null;
    }
    return AppDataSource.getRepository(ScanResult);
  }

  async createScan(data: CreateScanDto): Promise<Scan> {
    // Mock implementation when database is disabled
    if (process.env.SKIP_DB === 'true') {
      const mockScan = {
        id: this.nextId++,
        target: data.target,
        type: data.type,
        parameters: data.parameters,
        status: ScanStatus.PENDING,
        progress: 0,
        created_at: new Date(),
        updated_at: new Date(),
        user: data.userId ? { id: data.userId } : undefined,
        results: []
      };
      
      this.mockScans.set(mockScan.id, mockScan);
      
      // Start the scan asynchronously
      this.executeScan(mockScan.id).catch(error => {
        logger.error('Failed to execute scan', { scanId: mockScan.id, error });
      });
      
      return mockScan as any;
    }

    const scan = this.scanRepository!.create({
      target: data.target,
      type: data.type,
      parameters: data.parameters,
      status: ScanStatus.PENDING,
      user: data.userId ? { id: data.userId } : undefined
    });

    await this.scanRepository!.save(scan);
    
    // Start the scan asynchronously
    this.executeScan(scan.id).catch(error => {
      logger.error('Failed to execute scan', { scanId: scan.id, error });
    });

    return scan;
  }

  async getScan(id: number): Promise<Scan | undefined> {
    if (process.env.SKIP_DB === 'true') {
      return this.mockScans.get(id);
    }
    
    const result = await this.scanRepository!.findOne({
      where: { id },
      relations: ['results', 'user']
    });
    return result || undefined;
  }

  async getUserScans(userId: number): Promise<Scan[]> {
    if (process.env.SKIP_DB === 'true') {
      return Array.from(this.mockScans.values())
        .filter(scan => scan.user?.id === userId)
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
    
    return this.scanRepository!.find({
      where: { user: { id: userId } },
      order: { created_at: 'DESC' },
      relations: ['results']
    });
  }

  async getAllScans(): Promise<Scan[]> {
    if (process.env.SKIP_DB === 'true') {
      return Array.from(this.mockScans.values())
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
    
    return this.scanRepository!.find({
      order: { created_at: 'DESC' },
      relations: ['results', 'user']
    });
  }

  async updateScanProgress(scanId: number, progress: number, status?: ScanStatus) {
    const update: any = { progress };
    if (status) update.status = status;
    
    if (process.env.SKIP_DB !== 'true') {
      await this.scanRepository!.update(scanId, update);
    }
    
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
    let scan;
    
    if (process.env.SKIP_DB === 'true') {
      scan = this.mockScans.get(scanId);
    } else {
      scan = await this.scanRepository!.findOne({ where: { id: scanId } });
    }
    
    if (!scan) {
      logger.error('Scan not found', { scanId });
      return;
    }

    try {
      // Update scan status to running
      scan.status = ScanStatus.RUNNING;
      scan.started_at = new Date();
      
      if (process.env.SKIP_DB === 'true') {
        this.mockScans.set(scanId, scan);
      } else {
        await this.scanRepository!.save(scan);
      }

      // Start the appropriate PentestTools scan
      const ptScanResult = await this.startPentestToolsScan(scan);
      
      scan.pentest_tools_scan_id = ptScanResult.scan_id;
      scan.pentest_tools_target_id = ptScanResult.target_id;
      
      if (process.env.SKIP_DB === 'true') {
        this.mockScans.set(scanId, scan);
      } else {
        await this.scanRepository!.save(scan);
      }

      // Poll for scan completion
      const result = await pentestToolsService.waitForScanCompletion(
        ptScanResult.scan_id,
        5000 // Poll every 5 seconds
      );

      // Process and save results
      await this.processScanResults(scan, result.output);

      // Update scan status
      scan.status = ScanStatus.COMPLETED;
      scan.completed_at = new Date();
      scan.progress = 100;
      
      if (process.env.SKIP_DB === 'true') {
        this.mockScans.set(scanId, scan);
      } else {
        await this.scanRepository!.save(scan);
      }

      await this.updateScanProgress(scanId, 100, ScanStatus.COMPLETED);

    } catch (error: any) {
      logger.error('Scan execution failed', { scanId, error });
      
      scan.status = ScanStatus.FAILED;
      scan.error_message = error.message;
      scan.completed_at = new Date();
      
      if (process.env.SKIP_DB === 'true') {
        this.mockScans.set(scanId, scan);
      } else {
        await this.scanRepository!.save(scan);
      }

      await this.updateScanProgress(scanId, scan.progress, ScanStatus.FAILED);
    }
  }

  private async startPentestToolsScan(scan: Scan) {
    switch (scan.type) {
      case ScanType.SUBDOMAIN:
        return pentestToolsService.startSubdomainScan(scan.target, {
          scan_type: scan.parameters.scan_type || PTScanType.DEEP,
          web_details: scan.parameters.web_details !== false,
          whois: scan.parameters.whois || false,
          unresolved_results: scan.parameters.unresolved_results || false
        });

      case ScanType.PORT_SCAN:
        return pentestToolsService.startPortScan(scan.target, {
          scan_type: scan.parameters.scan_type || PTScanType.DEEP,
          protocol: scan.parameters.protocol || 'tcp',
          ports: scan.parameters.ports,
          os_detection: scan.parameters.os_detection || false,
          service_detection: scan.parameters.service_detection !== false,
          traceroute: scan.parameters.traceroute || false
        });

      case ScanType.WEBSITE:
        return pentestToolsService.startWebsiteScan(scan.target, {
          scan_type: scan.parameters.scan_type || PTScanType.DEEP,
          attack_active: scan.parameters.attack_active || ['xss', 'sqli', 'lfi'],
          crawl_depth: scan.parameters.crawl_depth,
          user_agent: scan.parameters.user_agent,
          excluded_paths: scan.parameters.excluded_paths
        });

      case ScanType.NETWORK:
        return pentestToolsService.startNetworkScan(scan.target, {
          preset: scan.parameters.preset || PTScanType.DEEP,
          scanning_engines: scan.parameters.scanning_engines || ['version_based', 'sniper', 'nuclei'],
          ports: scan.parameters.ports
        });

      case ScanType.API:
        return pentestToolsService.startAPIScan(scan.target, {
          openapi_url: scan.parameters.openapi_url,
          scan_type: scan.parameters.scan_type || PTScanType.DEEP
        });

      case ScanType.SSL:
        return pentestToolsService.startSSLScan(scan.target);

      case ScanType.WAF:
        return pentestToolsService.startWAFDetection(scan.target);

      // CMS Scanners
      case ScanType.WORDPRESS:
        return pentestToolsService.startWordPressScan(scan.target, {
          scan_type: scan.parameters.scan_type || PTScanType.DEEP,
          enumerate: scan.parameters.enumerate || ['users', 'plugins', 'themes']
        });

      case ScanType.DRUPAL:
        return pentestToolsService.startDrupalScan(scan.target, {
          scan_type: scan.parameters.scan_type || PTScanType.DEEP
        });

      case ScanType.JOOMLA:
        return pentestToolsService.startJoomlaScan(scan.target, {
          scan_type: scan.parameters.scan_type || PTScanType.DEEP
        });

      // case ScanType.MAGENTO:
      //   return pentestToolsService.startMagentoScan(scan.target, scan.parameters);

      case ScanType.SHAREPOINT:
        return pentestToolsService.startSharePointScan(scan.target, scan.parameters);

      // DNS & Domain Tools
      case ScanType.DNS_LOOKUP:
        return pentestToolsService.startDNSLookup(scan.target, scan.parameters);

      case ScanType.DNS_ZONE_TRANSFER:
        return pentestToolsService.startDNSZoneTransfer(scan.target, scan.parameters);

      case ScanType.WHOIS_LOOKUP:
        return pentestToolsService.startWhoisLookup(scan.target, scan.parameters);

      case ScanType.EMAIL_FINDER:
        return pentestToolsService.startEmailFinder(scan.target, scan.parameters);

      // Network Tools
      case ScanType.PING_HOST:
        return pentestToolsService.startPingHost(scan.target, scan.parameters);

      case ScanType.TRACEROUTE:
        return pentestToolsService.startTraceroute(scan.target, scan.parameters);

      // Web Application Testing
      case ScanType.HTTP_HEADERS:
        return pentestToolsService.startHTTPHeaders(scan.target, scan.parameters);

      // case ScanType.WEBSITE_SCREENSHOT:
      //   return pentestToolsService.startWebsiteScreenshot(scan.target, scan.parameters);

      case ScanType.WEBSITE_RECON:
        return pentestToolsService.startWebsiteRecon(scan.target, scan.parameters);

      case ScanType.URL_FUZZER:
        return pentestToolsService.startURLFuzzer(scan.target, scan.parameters);

      // Vulnerability Scanners
      // case ScanType.XSS:
      //   return pentestToolsService.startXSSScan(scan.target, scan.parameters);

      // case ScanType.SQLI:
      //   return pentestToolsService.startSQLiScan(scan.target, scan.parameters);

      // case ScanType.CORS:
      //   return pentestToolsService.startCORSScan(scan.target, scan.parameters);

      // Cloud & Advanced
      // case ScanType.S3_BUCKET:
      //   return pentestToolsService.startS3BucketFinder(scan.target, scan.parameters);

      // case ScanType.SUBDOMAIN_TAKEOVER:
      //   return pentestToolsService.startSubdomainTakeover(scan.target, scan.parameters);

      // case ScanType.GRAPHQL:
      //   return pentestToolsService.startGraphQLScan(scan.target, scan.parameters);

      // OSINT Tools
      // case ScanType.GOOGLE_HACKING:
      //   return pentestToolsService.startGoogleHacking(scan.target, scan.parameters);

      // case ScanType.BREACH_CHECK:
      //   return pentestToolsService.startBreachCheck(scan.target, scan.parameters);

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
    
    if (process.env.SKIP_DB === 'true') {
      // In mock mode, just add results to the scan object
      scan.results = results as any;
      this.mockScans.set(scan.id, scan);
    } else {
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
      await pentestToolsService.stopScan(scan.pentest_tools_scan_id);
    }

    scan.status = ScanStatus.CANCELLED;
    scan.completed_at = new Date();
    await this.scanRepository!.save(scan);
  }

  async deleteScan(scanId: number): Promise<void> {
    const scan = await this.scanRepository!.findOne({ where: { id: scanId } });
    if (!scan) throw new Error('Scan not found');

    if (scan.pentest_tools_scan_id) {
      await pentestToolsService.deleteScan(scan.pentest_tools_scan_id);
    }

    await this.scanResultRepository!.delete({ scan: { id: scanId } });
    await this.scanRepository!.delete(scanId);
  }
}

export default new ScanService();