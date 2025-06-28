// Utility for logging that's production-safe
// In production, all logging is disabled

interface Logger {
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

// Production-safe logger that does nothing in production
const createLogger = (): Logger => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    info: isDevelopment ? console.info.bind(console) : () => {},
    warn: isDevelopment ? console.warn.bind(console) : () => {},
    error: isDevelopment ? console.error.bind(console) : () => {},
    debug: isDevelopment ? console.debug.bind(console) : () => {},
  };
};

export const logger = createLogger();

// For production builds, this will be a no-op logger
// For development, it will use console methods
export default logger;
