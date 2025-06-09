import PDFDocument from 'pdfkit';
import { Scan } from '../models/scan.model';
import { ScanResult } from '../models/scanResult.model';

export class PDFGeneratorService {
  async generateScanReport(scan: Scan): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Header
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text('COBYTES SECURITY SCAN REPORT', { align: 'center' });
        
        doc.moveDown();
        doc.fontSize(12)
           .font('Helvetica')
           .text(new Date().toLocaleDateString(), { align: 'center' });
        
        doc.moveDown(2);

        // Scan Information
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Scan Information');
        
        doc.moveDown(0.5);
        doc.fontSize(11)
           .font('Helvetica');

        const info = [
          { label: 'Target', value: scan.target },
          { label: 'Scan Type', value: scan.type.toUpperCase() },
          { label: 'Status', value: scan.status.toUpperCase() },
          { label: 'Created', value: new Date(scan.created_at).toLocaleString() },
          { label: 'Completed', value: scan.completed_at ? new Date(scan.completed_at).toLocaleString() : 'N/A' },
          { label: 'Scan ID', value: scan.id.toString() }
        ];

        info.forEach(item => {
          doc.font('Helvetica-Bold').text(`${item.label}: `, { continued: true })
             .font('Helvetica').text(item.value);
        });

        doc.moveDown(2);

        // Executive Summary
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Executive Summary');
        
        doc.moveDown(0.5);
        doc.fontSize(11)
           .font('Helvetica');

        const results = scan.results || [];
        const severityCounts = {
          critical: results.filter(r => r.severity === 'critical').length,
          high: results.filter(r => r.severity === 'high').length,
          medium: results.filter(r => r.severity === 'medium').length,
          low: results.filter(r => r.severity === 'low').length,
          info: results.filter(r => r.severity === 'info').length
        };

        doc.text(`Total vulnerabilities found: ${results.length}`);
        doc.text(`Critical: ${severityCounts.critical}, High: ${severityCounts.high}, Medium: ${severityCounts.medium}, Low: ${severityCounts.low}, Info: ${severityCounts.info}`);

        doc.moveDown(2);

        // Findings
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Security Findings');
        
        doc.moveDown(0.5);

        if (results.length === 0) {
          doc.fontSize(11)
             .font('Helvetica')
             .text('No vulnerabilities were found during this scan.');
        } else {
          results.forEach((result, index) => {
            // Finding header
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text(`${index + 1}. ${result.title || 'Finding'}`);
            
            // Severity badge
            const severityColors: Record<string, string> = {
              critical: '#d32f2f',
              high: '#f57c00',
              medium: '#fbc02d',
              low: '#388e3c',
              info: '#1976d2'
            };
            
            doc.fontSize(10)
               .font('Helvetica-Bold')
               .fillColor(severityColors[result.severity] || '#666')
               .text(`Severity: ${result.severity.toUpperCase()}`)
               .fillColor('black');
            
            doc.moveDown(0.5);

            // Description
            if (result.description) {
              doc.fontSize(10)
                 .font('Helvetica')
                 .text(result.description, { align: 'justify' });
              doc.moveDown(0.5);
            }

            // Details
            if (result.details) {
              doc.font('Helvetica-Bold').text('Details:', { underline: true });
              doc.font('Helvetica').text(JSON.stringify(result.details));
              doc.moveDown(0.5);
            }

            // Recommendation
            if (result.recommendation) {
              doc.font('Helvetica-Bold').text('Recommendation:', { underline: true });
              doc.font('Helvetica').text(result.recommendation);
            }

            // References
            if ((result as any).references) {
              doc.moveDown(0.5);
              doc.font('Helvetica-Bold').text('References:', { underline: true });
              doc.font('Helvetica').text((result as any).references);
            }

            doc.moveDown(1.5);
          });
        }

        // Footer
        doc.fontSize(10)
           .font('Helvetica')
           .text('© 2024 Cobytes B.V. All rights reserved.', 
                 50, 
                 doc.page.height - 50, 
                 { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new PDFGeneratorService();