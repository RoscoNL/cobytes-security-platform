import * as cron from 'node-cron';
import { AppDataSource } from '../config/typeorm';
import { ScheduledScan, ScheduleFrequency } from '../models/scheduledScan.model';
import { ScanType } from '../models/scan.model';
import scanService from './scan.service';
import { logger } from '../utils/logger';

class SchedulerService {
  private jobs: Map<number, cron.ScheduledTask> = new Map();

  async initialize() {
    // Skip initialization if database is disabled
    if (process.env.SKIP_DB === 'true') {
      logger.warn('⚠️  Skipping scheduler initialization (SKIP_DB=true)');
      return;
    }
    
    // Load all active scheduled scans and create cron jobs
    const scheduledScans = await this.getActiveScheduledScans();
    
    for (const scheduledScan of scheduledScans) {
      this.scheduleJob(scheduledScan);
    }

    logger.info(`Initialized ${scheduledScans.length} scheduled scans`);
  }

  private async getActiveScheduledScans(): Promise<ScheduledScan[]> {
    const repository = AppDataSource.getRepository(ScheduledScan);
    return repository.find({
      where: { is_active: true },
      relations: ['user']
    });
  }

  async createScheduledScan(data: {
    name: string;
    target: string;
    scan_type: any;
    parameters: Record<string, any>;
    frequency: ScheduleFrequency;
    start_at?: Date;
    max_runs?: number;
    userId: number;
  }): Promise<ScheduledScan> {
    const repository = AppDataSource.getRepository(ScheduledScan);

    // Calculate cron expression and next run time
    const cronExpression = this.getCronExpression(data.frequency, data.start_at);
    const nextRunAt = this.getNextRunTime(data.frequency, data.start_at);

    const scheduledScan = repository.create({
      name: data.name,
      target: data.target,
      scan_type: data.scan_type,
      parameters: data.parameters,
      frequency: data.frequency,
      cron_expression: cronExpression,
      next_run_at: nextRunAt,
      max_runs: data.max_runs,
      user: { id: data.userId }
    });

    await repository.save(scheduledScan);

    // Schedule the job
    this.scheduleJob(scheduledScan);

    return scheduledScan;
  }

  async updateScheduledScan(id: number, data: Partial<{
    name: string;
    is_active: boolean;
    parameters: Record<string, any>;
    frequency: ScheduleFrequency;
    max_runs: number;
  }>): Promise<ScheduledScan | undefined> {
    const repository = AppDataSource.getRepository(ScheduledScan);
    const scheduledScan = await repository.findOne({ where: { id } });

    if (!scheduledScan) {
      return undefined;
    }

    // Stop existing job
    this.stopJob(id);

    // Update the scheduled scan
    Object.assign(scheduledScan, data);

    if (data.frequency) {
      scheduledScan.cron_expression = this.getCronExpression(data.frequency);
      scheduledScan.next_run_at = this.getNextRunTime(data.frequency);
    }

    await repository.save(scheduledScan);

    // Reschedule if active
    if (scheduledScan.is_active) {
      this.scheduleJob(scheduledScan);
    }

    return scheduledScan;
  }

  async deleteScheduledScan(id: number): Promise<void> {
    const repository = AppDataSource.getRepository(ScheduledScan);
    
    // Stop the job
    this.stopJob(id);
    
    // Delete from database
    await repository.delete(id);
  }

  async getScheduledScans(userId?: number): Promise<ScheduledScan[]> {
    const repository = AppDataSource.getRepository(ScheduledScan);
    const query = repository.createQueryBuilder('scheduledScan')
      .leftJoinAndSelect('scheduledScan.user', 'user');

    if (userId) {
      query.where('scheduledScan.user.id = :userId', { userId });
    }

    return query.orderBy('scheduledScan.created_at', 'DESC').getMany();
  }

  private scheduleJob(scheduledScan: ScheduledScan) {
    if (!scheduledScan.cron_expression || !scheduledScan.is_active) {
      return;
    }

    const job = cron.schedule(scheduledScan.cron_expression, async () => {
      await this.runScheduledScan(scheduledScan);
    });

    this.jobs.set(scheduledScan.id, job);
    logger.info(`Scheduled scan ${scheduledScan.id} (${scheduledScan.name}) with cron: ${scheduledScan.cron_expression}`);
  }

  private stopJob(scheduledScanId: number) {
    const job = this.jobs.get(scheduledScanId);
    if (job) {
      job.stop();
      this.jobs.delete(scheduledScanId);
      logger.info(`Stopped scheduled scan ${scheduledScanId}`);
    }
  }

  private async runScheduledScan(scheduledScan: ScheduledScan) {
    const repository = AppDataSource.getRepository(ScheduledScan);

    try {
      logger.info(`Running scheduled scan ${scheduledScan.id} (${scheduledScan.name})`);

      // Create a new scan
      await scanService.createScan({
        target: scheduledScan.target,
        type: scheduledScan.scan_type as ScanType,
        parameters: scheduledScan.parameters,
        userId: scheduledScan.user?.id
      });

      // Update last run and run count
      scheduledScan.last_run_at = new Date();
      scheduledScan.run_count += 1;

      // Calculate next run time
      scheduledScan.next_run_at = this.getNextRunTime(scheduledScan.frequency as ScheduleFrequency);

      // Check if we've reached max runs
      if (scheduledScan.max_runs && scheduledScan.run_count >= scheduledScan.max_runs) {
        scheduledScan.is_active = false;
        this.stopJob(scheduledScan.id);
        logger.info(`Scheduled scan ${scheduledScan.id} reached max runs (${scheduledScan.max_runs})`);
      }

      await repository.save(scheduledScan);

    } catch (error) {
      logger.error(`Failed to run scheduled scan ${scheduledScan.id}`, error);
    }
  }

  private getCronExpression(frequency: ScheduleFrequency, startTime?: Date): string {
    const time = startTime || new Date();
    const minutes = time.getMinutes();
    const hours = time.getHours();
    const dayOfMonth = time.getDate();
    const dayOfWeek = time.getDay();

    switch (frequency) {
      case ScheduleFrequency.ONCE:
        // For one-time scans, we'll handle differently
        return `${minutes} ${hours} ${dayOfMonth} * *`;
      
      case ScheduleFrequency.DAILY:
        return `${minutes} ${hours} * * *`;
      
      case ScheduleFrequency.WEEKLY:
        return `${minutes} ${hours} * * ${dayOfWeek}`;
      
      case ScheduleFrequency.MONTHLY:
        return `${minutes} ${hours} ${dayOfMonth} * *`;
      
      default:
        return '0 0 * * *'; // Default to daily at midnight
    }
  }

  private getNextRunTime(frequency: ScheduleFrequency, startTime?: Date): Date {
    const now = new Date();
    const nextRun = startTime && startTime > now ? new Date(startTime) : new Date();

    switch (frequency) {
      case ScheduleFrequency.ONCE:
        return startTime || now;
      
      case ScheduleFrequency.DAILY:
        if (!startTime || startTime <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        return nextRun;
      
      case ScheduleFrequency.WEEKLY:
        if (!startTime || startTime <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }
        return nextRun;
      
      case ScheduleFrequency.MONTHLY:
        if (!startTime || startTime <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        return nextRun;
      
      default:
        return nextRun;
    }
  }

  async stop() {
    // Stop all cron jobs
    for (const [id, job] of this.jobs) {
      job.stop();
    }
    this.jobs.clear();
    logger.info('Stopped all scheduled scans');
  }
}

export default new SchedulerService();