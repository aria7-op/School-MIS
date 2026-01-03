/**
 * Logger utility to replace console.log/error/warn
 * In production, logs can be sent to error tracking service
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  private log(level: LogLevel, message: string, data?: any, context?: string) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context,
    };

    // Store in history
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // In development, use console
    if (this.isDevelopment) {
      const consoleMethod = console[level] || console.log;
      if (data) {
        consoleMethod(`[${level.toUpperCase()}] ${message}`, data);
      } else {
        consoleMethod(`[${level.toUpperCase()}] ${message}`);
      }
    } else {
      // In production, send to error tracking service (e.g., Sentry)
      if (level === 'error' || level === 'warn') {
        // TODO: Integrate with error tracking service
        // Example: Sentry.captureException(new Error(message), { extra: data });
      }
    }
  }

  debug(message: string, data?: any, context?: string) {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: any, context?: string) {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: any, context?: string) {
    this.log('warn', message, data, context);
  }

  error(message: string, error?: any, context?: string) {
    this.log('error', message, error, context);
  }

  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  clearHistory() {
    this.logHistory = [];
  }
}

// Export singleton instance
export const logger = new Logger();

// Export default for convenience
export default logger;

// Initialize and expose globally for use throughout the app
export const initLogger = () => {
  if (typeof window !== 'undefined') {
    (window as any).logger = logger;
  }
};


