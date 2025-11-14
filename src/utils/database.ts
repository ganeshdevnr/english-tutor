import { PrismaClient } from '@prisma/client';
import logger from './logger';

/**
 * Prisma client singleton
 * Ensures only one instance is created across the application
 */
class Database {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!Database.instance) {
      Database.instance = new PrismaClient({
        log: [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' },
        ],
      });

      // Log database queries in development
      if (process.env.NODE_ENV === 'development') {
        Database.instance.$on('query' as never, (e: unknown) => {
          const event = e as { query: string; duration: number };
          logger.debug('Database Query', {
            query: event.query,
            duration: `${event.duration}ms`,
          });
        });
      }

      // Log database errors
      Database.instance.$on('error' as never, (e: unknown) => {
        const event = e as { message: string };
        logger.error('Database Error', { message: event.message });
      });

      // Log database warnings
      Database.instance.$on('warn' as never, (e: unknown) => {
        const event = e as { message: string };
        logger.warn('Database Warning', { message: event.message });
      });

      logger.info('Database connection established');
    }

    return Database.instance;
  }

  public static async disconnect(): Promise<void> {
    if (Database.instance) {
      await Database.instance.$disconnect();
      logger.info('Database connection closed');
    }
  }

  public static async healthCheck(): Promise<boolean> {
    try {
      const client = Database.getInstance();
      await client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed', { error });
      return false;
    }
  }
}

export const prisma = Database.getInstance();
export default Database;
