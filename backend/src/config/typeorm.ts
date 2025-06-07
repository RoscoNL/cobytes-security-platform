import { DataSource } from 'typeorm';
import { User } from '../models/user.model';
import { Scan } from '../models/scan.model';
import { ScanResult } from '../models/scanResult.model';
import { ScheduledScan } from '../models/scheduledScan.model';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

// Parse DATABASE_URL if available
const getDatabaseConfig = () => {
  const config: any = {};
  
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    config.type = 'postgres';
    config.host = url.hostname;
    config.port = parseInt(url.port);
    config.username = url.username;
    config.password = url.password;
    config.database = url.pathname.slice(1);
    
    // SSL configuration for DigitalOcean managed database
    if (url.searchParams.get('sslmode') === 'require') {
      const certPath = path.join(__dirname, '../../ca-certificate.crt');
      if (fs.existsSync(certPath)) {
        config.ssl = {
          rejectUnauthorized: true,
          ca: fs.readFileSync(certPath).toString()
        };
      } else {
        // Fallback to less secure SSL if cert not found
        config.ssl = {
          rejectUnauthorized: false
        };
        logger.warn('CA certificate not found, using less secure SSL connection');
      }
    }
  } else {
    config.type = 'postgres';
    config.host = process.env.DB_HOST || 'localhost';
    config.port = parseInt(process.env.DB_PORT || '5432');
    config.username = process.env.DB_USER || 'cobytes_user';
    config.password = process.env.DB_PASSWORD || 'cobytes_password';
    config.database = process.env.DB_NAME || 'cobytes_db';
  }
  
  return config;
};

export const AppDataSource = new DataSource({
  ...getDatabaseConfig(),
  synchronize: process.env.NODE_ENV === 'development', // Auto-create tables in dev
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Scan, ScanResult, ScheduledScan],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});

export const initializeDatabase = async () => {
  // Skip database initialization if SKIP_DB is set
  if (process.env.SKIP_DB === 'true') {
    logger.warn('⚠️  Skipping database connection (SKIP_DB=true)');
    return;
  }
  
  try {
    await AppDataSource.initialize();
    logger.info('✅ TypeORM connected to PostgreSQL');
    logger.info(`📊 Database: ${AppDataSource.options.database}`);
  } catch (error) {
    logger.error('❌ TypeORM connection failed:', error);
    throw error;
  }
};

export const closeDatabase = async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    logger.info('PostgreSQL connection closed');
  }
};