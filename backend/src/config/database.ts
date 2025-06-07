import { Pool } from 'pg';
import { logger } from '@utils/logger';

// Database connection pool
let pool: Pool | null = null;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cobytes',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: parseInt(process.env.DB_POOL_SIZE || '20'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Connect to database
export const connectDatabase = async (): Promise<void> => {
  // Skip connection in development if DB is not available
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_DB === 'true') {
    logger.warn('⚠️  Skipping PostgreSQL connection (SKIP_DB=true)');
    return;
  }
  
  try {
    pool = new Pool(dbConfig);
    
    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    logger.info('✅ PostgreSQL connected successfully');
    logger.info(`📊 Database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
    
    // Handle pool errors
    pool.on('error', (err) => {
      logger.error('Unexpected database error:', err);
    });
  } catch (error) {
    logger.error('❌ PostgreSQL connection failed:', error);
    throw error;
  }
};

// Get database pool
export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDatabase() first.');
  }
  return pool;
};

// Close database connection
export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    logger.info('PostgreSQL connection closed');
  }
};

// Query helper
export const query = async (text: string, params?: any[]): Promise<any> => {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug({
      query: text,
      params,
      duration: `${duration}ms`,
      rows: result.rowCount
    });
    
    return result;
  } catch (error) {
    logger.error('Database query error:', { text, params, error });
    throw error;
  }
};

// Transaction helper
export const withTransaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
