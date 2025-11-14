import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Centralized configuration management
 * All environment variables are accessed through this module
 */
interface Config {
  app: {
    env: string;
    port: number;
    apiPrefix: string;
  };
  database: {
    url: string;
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiry: string;
    refreshExpiry: string;
  };
  security: {
    bcryptRounds: number;
    maxLoginAttempts: number;
    accountLockoutDuration: number;
  };
  cors: {
    origin: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
    file: string;
  };
  agent: {
    serviceUrl: string;
    timeout: number;
  };
}

const config: Config = {
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '8000', 10),
    apiPrefix: process.env.API_PREFIX || '/api',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default-access-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-me',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    accountLockoutDuration: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION || '900000', 10), // 15 minutes
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  agent: {
    serviceUrl: process.env.AGENT_SERVICE_URL || 'http://localhost:8001',
    timeout: parseInt(process.env.AGENT_SERVICE_TIMEOUT || '30000', 10),
  },
};

/**
 * Validate required configuration
 */
export function validateConfig(): void {
  const requiredVars = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (config.app.env === 'production') {
    // Additional production checks
    if (
      config.jwt.accessSecret === 'default-access-secret-change-me' ||
      config.jwt.refreshSecret === 'default-refresh-secret-change-me'
    ) {
      throw new Error('Default JWT secrets detected in production environment');
    }

    if (config.security.bcryptRounds < 12) {
      throw new Error('BCRYPT_ROUNDS must be at least 12 in production');
    }
  }
}

export default config;
