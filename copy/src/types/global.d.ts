import { logger } from '../utils/logger';

declare global {
  interface Window {
    logger: typeof logger;
  }
}

export {};


