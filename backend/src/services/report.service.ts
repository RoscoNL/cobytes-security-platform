import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import { Scan, ScanStatus } from '../models/scan.model';
import { ScanResult, ResultSeverity } from '../models/scanResult.model';
import { AppDataSource } from '../config/typeorm';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

interface ReportOptions {
  format: 'pdf' | 'csv' | 'json';
  includeDetails?: boolean;
  groupBySeverity?: boolean;
}

class ReportService {
  private reportsDir = path.join(process.cwd(), 'reports');

  constructor() {
    // Ensure reports directory exists
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  async generateReport(scanId: number, options: ReportOptions): Promise<string> {
    const scanRepository = AppDataSource.getRepository(Scan);
    const scan = await scanRepository.findOne({
      where: { id: scanId },
      relations: ['results', 'user']
    });

    if (!scan) {
      throw new Error('Scan not found');
    }

    const filename = `scan-report-${scanId}-${Date.now()}.${options.format}`;
    const filepath = path.join(this.reportsDir, filename);

    switch (options.format) {
      case 'pdf':
        await this.generatePDFReport(scan, filepath, options);
        break;
      case 'csv':
        await this.generateCSVReport(scan, filepath, options);
        break;
      case 'json':
        await this.generateJSONReport(scan, filepath, options);
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }

    logger.info(`Generated ${options.format} report for scan ${scanId}`);
    return filepath;
  }

  private async generatePDFReport(scan: Scan, filepath: string, options: ReportOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc.fontSize(24).text('Security Scan Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);

      // Scan Information
      doc.fontSize(16).text('Scan Information', { underline: true });
      doc.fontSize(12);
      doc.text(`Target: ${scan.target}`);
      doc.text(`Type: ${scan.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
      doc.text(`Status: ${scan.status}`);
      doc.text(`Started: ${scan.started_at ? new Date(scan.started_at).toLocaleString() : 'N/A'}`);
      doc.text(`Completed: ${scan.completed_at ? new Date(scan.completed_at).toLocaleString() : 'N/A'}`);
      
      if (scan.started_at && scan.completed_at) {
        const duration = Math.round((new Date(scan.completed_at).getTime() - new Date(scan.started_at).getTime()) / 1000);
        doc.text(`Duration: ${duration} seconds`);
      }

      doc.moveDown();

      // Summary
      if (scan.results && scan.results.length > 0) {
        doc.fontSize(16).text('Summary', { underline: true });
        doc.fontSize(12);

        const severityCounts = this.countBySeverity(scan.results);
        doc.text(`Total Findings: ${scan.results.length}`);
        doc.text(`Critical: ${severityCounts.critical}`);
        doc.text(`High: ${severityCounts.high}`);
        doc.text(`Medium: ${severityCounts.medium}`);
        doc.text(`Low: ${severityCounts.low}`);
        doc.text(`Info: ${severityCounts.info}`);

        doc.moveDown();

        // Detailed Findings
        if (options.includeDetails) {
          doc.fontSize(16).text('Detailed Findings', { underline: true });
          doc.fontSize(12);

          const groupedResults = options.groupBySeverity 
            ? this.groupResultsBySeverity(scan.results)
            : { all: scan.results };

          for (const [severity, results] of Object.entries(groupedResults)) {
            if (results.length === 0) continue;

            if (options.groupBySeverity) {
              doc.moveDown();
              doc.fontSize(14).text(`${severity.toUpperCase()} Severity`, { underline: true });
              doc.fontSize(12);
            }

            results.forEach((result, index) => {
              doc.moveDown();
              doc.text(`${index + 1}. ${result.title}`, { underline: true });
              
              if (result.affected_component) {
                doc.text(`Affected: ${result.affected_component}`);
              }
              
              if (result.description) {
                doc.text(`Description: ${result.description}`);
              }
              
              if (result.recommendation) {
                doc.text(`Recommendation: ${result.recommendation}`);
              }
              
              if (result.cve_id) {
                doc.text(`CVE: ${result.cve_id}`);
              }
              
              if (result.cvss_score) {
                doc.text(`CVSS Score: ${result.cvss_score}`);
              }
            });
          }
        }
      } else {
        doc.fontSize(14).text('No findings detected', { align: 'center' });
      }

      // Footer
      doc.moveDown();
      doc.fontSize(10).text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
      doc.text('Powered by Cobytes Security Platform', { align: 'center' });

      doc.end();

      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }

  private async generateCSVReport(scan: Scan, filepath: string, options: ReportOptions): Promise<void> {
    if (!scan.results || scan.results.length === 0) {
      fs.writeFileSync(filepath, 'No results found');
      return;
    }

    const fields = [
      'severity',
      'title',
      'type',
      'affected_component',
      'description',
      'recommendation',
      'cve_id',
      'cvss_score'
    ];

    const data = scan.results.map(result => ({
      severity: result.severity,
      title: result.title,
      type: result.type,
      affected_component: result.affected_component || '',
      description: result.description || '',
      recommendation: result.recommendation || '',
      cve_id: result.cve_id || '',
      cvss_score: result.cvss_score || ''
    }));

    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    fs.writeFileSync(filepath, csv);
  }

  private async generateJSONReport(scan: Scan, filepath: string, options: ReportOptions): Promise<void> {
    const report = {
      scan: {
        id: scan.id,
        target: scan.target,
        type: scan.type,
        status: scan.status,
        parameters: scan.parameters,
        started_at: scan.started_at,
        completed_at: scan.completed_at,
        created_at: scan.created_at
      },
      summary: scan.results ? this.countBySeverity(scan.results) : null,
      results: options.includeDetails ? scan.results : scan.results?.length || 0,
      generated_at: new Date().toISOString()
    };

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  }

  private countBySeverity(results: ScanResult[]) {
    return {
      critical: results.filter(r => r.severity === ResultSeverity.CRITICAL).length,
      high: results.filter(r => r.severity === ResultSeverity.HIGH).length,
      medium: results.filter(r => r.severity === ResultSeverity.MEDIUM).length,
      low: results.filter(r => r.severity === ResultSeverity.LOW).length,
      info: results.filter(r => r.severity === ResultSeverity.INFO).length
    };
  }

  private groupResultsBySeverity(results: ScanResult[]) {
    return {
      critical: results.filter(r => r.severity === ResultSeverity.CRITICAL),
      high: results.filter(r => r.severity === ResultSeverity.HIGH),
      medium: results.filter(r => r.severity === ResultSeverity.MEDIUM),
      low: results.filter(r => r.severity === ResultSeverity.LOW),
      info: results.filter(r => r.severity === ResultSeverity.INFO)
    };
  }

  async getReportPath(filename: string): Promise<string | null> {
    const filepath = path.join(this.reportsDir, filename);
    
    if (fs.existsSync(filepath)) {
      return filepath;
    }
    
    return null;
  }

  async deleteReport(filename: string): Promise<void> {
    const filepath = path.join(this.reportsDir, filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      logger.info(`Deleted report: ${filename}`);
    }
  }

  async cleanupOldReports(daysOld: number = 30): Promise<void> {
    const now = Date.now();
    const maxAge = daysOld * 24 * 60 * 60 * 1000;

    const files = fs.readdirSync(this.reportsDir);
    
    for (const file of files) {
      const filepath = path.join(this.reportsDir, file);
      const stats = fs.statSync(filepath);
      
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filepath);
        logger.info(`Cleaned up old report: ${file}`);
      }
    }
  }
}

export default new ReportService();