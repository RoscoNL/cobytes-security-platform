import { DataSource } from 'typeorm';
import { User } from '../models/user.model';
import { Scan } from '../models/scan.model';
import { ScanResult } from '../models/scanResult.model';
import { ScheduledScan } from '../models/scheduledScan.model';
import { logger } from '../utils/logger';

// Parse DATABASE_URL if available
const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      type: 'postgres' as const,
      host: url.hostname,
      port: parseInt(url.port),
      username: url.username,
      password: url.password,
      database: url.pathname.slice(1),
    };
  }
  return {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'cobytes_user',
    password: process.env.DB_PASSWORD || 'cobytes_password',
    database: process.env.DB_NAME || 'cobytes_db',
  };
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