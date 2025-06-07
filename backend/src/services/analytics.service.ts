import { AppDataSource } from '../config/typeorm';
import { Scan, ScanType, ScanStatus } from '../models/scan.model';
import { ScanResult, ResultSeverity } from '../models/scanResult.model';
import { logger } from '../utils/logger';

interface ScanStatistics {
  totalScans: number;
  completedScans: number;
  failedScans: number;
  averageDuration: number;
  scansByType: Record<string, number>;
  scansByStatus: Record<string, number>;
}

interface VulnerabilityStatistics {
  totalFindings: number;
  findingsBySeverity: Record<string, number>;
  topVulnerabilityTypes: Array<{ type: string; count: number }>;
  averageFindingsPerScan: number;
}

interface TimeSeriesData {
  date: string;
  scans: number;
  findings: number;
  criticalFindings: number;
}

interface TargetAnalytics {
  target: string;
  scanCount: number;
  lastScan: Date;
  totalFindings: number;
  criticalFindings: number;
  trend: 'improving' | 'worsening' | 'stable';
}

class AnalyticsService {
  async getScanStatistics(userId?: number, dateFrom?: Date, dateTo?: Date): Promise<ScanStatistics> {
    const scanRepository = AppDataSource.getRepository(Scan);
    
    let query = scanRepository.createQueryBuilder('scan');
    
    if (userId) {
      query = query.where('scan.user.id = :userId', { userId });
    }
    
    if (dateFrom) {
      query = query.andWhere('scan.created_at >= :dateFrom', { dateFrom });
    }
    
    if (dateTo) {
      query = query.andWhere('scan.created_at <= :dateTo', { dateTo });
    }
    
    const scans = await query.getMany();
    
    const completedScans = scans.filter(s => s.status === ScanStatus.COMPLETED);
    const durations = completedScans
      .filter(s => s.started_at && s.completed_at)
      .map(s => new Date(s.completed_at!).getTime() - new Date(s.started_at!).getTime());
    
    const averageDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length / 1000 
      : 0;
    
    const scansByType: Record<string, number> = {};
    const scansByStatus: Record<string, number> = {};
    
    scans.forEach(scan => {
      scansByType[scan.type] = (scansByType[scan.type] || 0) + 1;
      scansByStatus[scan.status] = (scansByStatus[scan.status] || 0) + 1;
    });
    
    return {
      totalScans: scans.length,
      completedScans: completedScans.length,
      failedScans: scans.filter(s => s.status === ScanStatus.FAILED).length,
      averageDuration: Math.round(averageDuration),
      scansByType,
      scansByStatus
    };
  }

  async getVulnerabilityStatistics(userId?: number, dateFrom?: Date, dateTo?: Date): Promise<VulnerabilityStatistics> {
    const resultRepository = AppDataSource.getRepository(ScanResult);
    
    let query = resultRepository.createQueryBuilder('result')
      .leftJoinAndSelect('result.scan', 'scan');
    
    if (userId) {
      query = query.where('scan.user.id = :userId', { userId });
    }
    
    if (dateFrom) {
      query = query.andWhere('result.created_at >= :dateFrom', { dateFrom });
    }
    
    if (dateTo) {
      query = query.andWhere('result.created_at <= :dateTo', { dateTo });
    }
    
    const results = await query.getMany();
    
    const findingsBySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };
    
    const typeCount: Record<string, number> = {};
    
    results.forEach(result => {
      findingsBySeverity[result.severity] = (findingsBySeverity[result.severity] || 0) + 1;
      typeCount[result.type] = (typeCount[result.type] || 0) + 1;
    });
    
    const topVulnerabilityTypes = Object.entries(typeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));
    
    // Get unique scan count for average calculation
    const uniqueScanIds = new Set(results.map(r => r.scan?.id).filter(Boolean));
    const averageFindingsPerScan = uniqueScanIds.size > 0 
      ? results.length / uniqueScanIds.size 
      : 0;
    
    return {
      totalFindings: results.length,
      findingsBySeverity,
      topVulnerabilityTypes,
      averageFindingsPerScan: Math.round(averageFindingsPerScan * 10) / 10
    };
  }

  async getTimeSeriesData(userId?: number, days: number = 30): Promise<TimeSeriesData[]> {
    const scanRepository = AppDataSource.getRepository(Scan);
    const resultRepository = AppDataSource.getRepository(ScanResult);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const data: TimeSeriesData[] = [];
    
    for (let i = 0; i <= days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Count scans for this day
      let scanQuery = scanRepository.createQueryBuilder('scan')
        .where('scan.created_at >= :currentDate', { currentDate })
        .andWhere('scan.created_at < :nextDate', { nextDate });
      
      if (userId) {
        scanQuery = scanQuery.andWhere('scan.user.id = :userId', { userId });
      }
      
      const scanCount = await scanQuery.getCount();
      
      // Count findings for this day
      let resultQuery = resultRepository.createQueryBuilder('result')
        .leftJoinAndSelect('result.scan', 'scan')
        .where('result.created_at >= :currentDate', { currentDate })
        .andWhere('result.created_at < :nextDate', { nextDate });
      
      if (userId) {
        resultQuery = resultQuery.andWhere('scan.user.id = :userId', { userId });
      }
      
      const results = await resultQuery.getMany();
      const criticalCount = results.filter(r => r.severity === ResultSeverity.CRITICAL).length;
      
      data.push({
        date: currentDate.toISOString().split('T')[0],
        scans: scanCount,
        findings: results.length,
        criticalFindings: criticalCount
      });
    }
    
    return data;
  }

  async getTargetAnalytics(userId?: number, limit: number = 10): Promise<TargetAnalytics[]> {
    const scanRepository = AppDataSource.getRepository(Scan);
    
    let query = scanRepository.createQueryBuilder('scan')
      .leftJoinAndSelect('scan.results', 'results')
      .where('scan.status = :status', { status: ScanStatus.COMPLETED });
    
    if (userId) {
      query = query.andWhere('scan.user.id = :userId', { userId });
    }
    
    const scans = await query.getMany();
    
    // Group by target
    const targetMap = new Map<string, {
      scans: Scan[];
      totalFindings: number;
      criticalFindings: number;
    }>();
    
    scans.forEach(scan => {
      const existing = targetMap.get(scan.target) || {
        scans: [],
        totalFindings: 0,
        criticalFindings: 0
      };
      
      existing.scans.push(scan);
      
      if (scan.results) {
        existing.totalFindings += scan.results.length;
        existing.criticalFindings += scan.results.filter(r => r.severity === ResultSeverity.CRITICAL).length;
      }
      
      targetMap.set(scan.target, existing);
    });
    
    // Convert to analytics format
    const analytics: TargetAnalytics[] = [];
    
    targetMap.forEach((data, target) => {
      const sortedScans = data.scans.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      const latestScan = sortedScans[0];
      const previousScan = sortedScans[1];
      
      let trend: 'improving' | 'worsening' | 'stable' = 'stable';
      
      if (latestScan && previousScan && latestScan.results && previousScan.results) {
        const latestCritical = latestScan.results.filter(r => r.severity === ResultSeverity.CRITICAL).length;
        const previousCritical = previousScan.results.filter(r => r.severity === ResultSeverity.CRITICAL).length;
        
        if (latestCritical < previousCritical) {
          trend = 'improving';
        } else if (latestCritical > previousCritical) {
          trend = 'worsening';
        }
      }
      
      analytics.push({
        target,
        scanCount: data.scans.length,
        lastScan: latestScan.created_at,
        totalFindings: data.totalFindings,
        criticalFindings: data.criticalFindings,
        trend
      });
    });
    
    // Sort by scan count and limit
    return analytics
      .sort((a, b) => b.scanCount - a.scanCount)
      .slice(0, limit);
  }

  async getComparisonData(scanId1: number, scanId2: number): Promise<{
    scan1: any;
    scan2: any;
    newFindings: ScanResult[];
    resolvedFindings: ScanResult[];
    unchangedFindings: ScanResult[];
  }> {
    const scanRepository = AppDataSource.getRepository(Scan);
    
    const scan1 = await scanRepository.findOne({
      where: { id: scanId1 },
      relations: ['results']
    });
    
    const scan2 = await scanRepository.findOne({
      where: { id: scanId2 },
      relations: ['results']
    });
    
    if (!scan1 || !scan2) {
      throw new Error('One or both scans not found');
    }
    
    const results1 = scan1.results || [];
    const results2 = scan2.results || [];
    
    // Create fingerprints for comparison
    const getFingerprint = (result: ScanResult) => 
      `${result.type}-${result.affected_component}-${result.severity}`;
    
    const fingerprints1 = new Set(results1.map(getFingerprint));
    const fingerprints2 = new Set(results2.map(getFingerprint));
    
    const newFindings = results2.filter(r => !fingerprints1.has(getFingerprint(r)));
    const resolvedFindings = results1.filter(r => !fingerprints2.has(getFingerprint(r)));
    const unchangedFindings = results2.filter(r => fingerprints1.has(getFingerprint(r)));
    
    return {
      scan1: {
        id: scan1.id,
        target: scan1.target,
        created_at: scan1.created_at,
        findings: results1.length
      },
      scan2: {
        id: scan2.id,
        target: scan2.target,
        created_at: scan2.created_at,
        findings: results2.length
      },
      newFindings,
      resolvedFindings,
      unchangedFindings
    };
  }
}

export default new AnalyticsService();