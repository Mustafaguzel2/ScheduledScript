import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

// Base directory for all job logs
const LOG_DIR = path.join(process.cwd(), 'logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Log levels
export type LogLevel = 'info' | 'error' | 'success';

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

// Get the log file path for a specific job
export function getLogFilePath(jobId: string): string {
  return path.join(LOG_DIR, `job-${jobId}.log`);
}

// Write log entry to a file
export function writeLog(jobId: string, level: LogLevel, message: string): void {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const logEntry: LogEntry = {
    timestamp,
    level,
    message
  };
  
  const logFilePath = getLogFilePath(jobId);
  
  // Write to file
  fs.appendFileSync(
    logFilePath, 
    JSON.stringify(logEntry) + '\n', 
    { encoding: 'utf8' }
  );
}

// Read logs for a specific job
export function readLogs(jobId: string): LogEntry[] {
  const logFilePath = getLogFilePath(jobId);
  
  if (!fs.existsSync(logFilePath)) {
    return [];
  }
  
  try {
    const fileContent = fs.readFileSync(logFilePath, { encoding: 'utf8' });
    
    return fileContent
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => JSON.parse(line) as LogEntry)
      .reverse(); // Reverse order to show newest logs first
  } catch (error) {
    console.error(`Error reading logs for job ${jobId}:`, error);
    return [];
  }
} 