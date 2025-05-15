import fs from 'fs';
import path from 'path';
import { Job, scheduleJob } from 'node-schedule';
import { getLogFilePath } from './logger';

export interface ScheduledJobData {
  id: string;
  cronExpression: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'canceled';
  created: string; // ISO date string
  lastRun?: string; // ISO date string
  nextRun?: string; // ISO date string
  scriptPath?: string;
  scriptName?: string; // Added to store the script name
  hasLogs?: boolean;
  canceled?: boolean; // Flag to mark deleted jobs
}

// Active jobs in memory (will be rebuilt from persistent storage on server start)
const activeJobs: Record<string, Job> = {};

// Get path to jobs.json file
const getJobsFilePath = () => {
  const dataDir = path.join(process.cwd(), 'data');
  
  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  return path.join(dataDir, 'jobs.json');
};

// Read all jobs from storage
export function readJobsFromFile(): ScheduledJobData[] {
  try {
    const filePath = getJobsFilePath();
    
    if (!fs.existsSync(filePath)) {
      // Create empty jobs file if it doesn't exist
      fs.writeFileSync(filePath, JSON.stringify({ jobs: [] }));
      return [];
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    return Array.isArray(jsonData.jobs) ? jsonData.jobs : [];
  } catch (error) {
    console.error('Error reading jobs file:', error);
    return [];
  }
}

// Write jobs to storage
export function writeJobsToFile(jobs: ScheduledJobData[]): void {
  try {
    const filePath = getJobsFilePath();
    fs.writeFileSync(filePath, JSON.stringify({ jobs }, null, 2));
  } catch (error) {
    console.error('Error writing jobs file:', error);
  }
}

// Store a job
export function storeJobToFile(jobData: ScheduledJobData): void {
  const jobs = readJobsFromFile();
  const existingJobIndex = jobs.findIndex(job => job.id === jobData.id);
  
  if (existingJobIndex >= 0) {
    // Update existing job
    jobs[existingJobIndex] = jobData;
  } else {
    // Add new job
    jobs.push(jobData);
  }
  
  writeJobsToFile(jobs);
}

// Get a job by ID
export function getJobFromFile(id: string): ScheduledJobData | undefined {
  const job = readJobsFromFile().find(job => job.id === id);
  if (!job) return undefined;
  return {
    ...job,
    hasLogs: jobHasLogs(job.id),
  };
}

// Get all jobs
export function getAllJobsFromFile(): ScheduledJobData[] {
  return readJobsFromFile()
    .filter(job => !job.canceled)
    .map(job => ({
      ...job,
      hasLogs: jobHasLogs(job.id),
    }));
}

// Update job status
export function updateJobStatusInFile(id: string, status: ScheduledJobData['status']): ScheduledJobData | undefined {
  const jobs = readJobsFromFile();
  const jobIndex = jobs.findIndex(job => job.id === id);
  
  if (jobIndex === -1) return undefined;
  
  // Check if job is marked as canceled
  if (jobs[jobIndex].canceled) {
    console.log(`Job ${id} is canceled, skipping status update`);
    return undefined;
  }
  
  const updatedJob = {
    ...jobs[jobIndex],
    status,
    ...(status === 'running' ? { lastRun: new Date().toISOString() } : {}),
  };
  
  // Update nextRun if we have the job in memory
  if (activeJobs[id] && status !== 'running') {
    const nextInvocation = activeJobs[id].nextInvocation();
    if (nextInvocation) {
      updatedJob.nextRun = nextInvocation.toISOString();
    }
  }
  
  jobs[jobIndex] = updatedJob;
  writeJobsToFile(jobs);
  
  return updatedJob;
}

// Delete a job
export function deleteJobFromFile(id: string): boolean {
  const jobs = readJobsFromFile();
  const jobIndex = jobs.findIndex(job => job.id === id);
  
  if (jobIndex === -1) {
    return false; // Job wasn't found
  }
  
  // Cancel the job if it's active in memory
  if (activeJobs[id]) {
    try {
      activeJobs[id].cancel();
      delete activeJobs[id];
      console.log(`Successfully canceled job ${id} in memory`);
    } catch (error) {
      console.error(`Error canceling job ${id} in memory:`, error);
    }
  }
  
  // Actually remove the job from the list instead of just marking it as canceled
  jobs.splice(jobIndex, 1);
  
  writeJobsToFile(jobs);
  console.log(`Job ${id} completely removed from jobs file`);
  return true;
}

// Clean up canceled jobs (removes them completely from the file)
export function cleanupCanceledJobs(): void {
  const jobs = readJobsFromFile();
  const filteredJobs = jobs.filter(job => !job.canceled);
  
  if (filteredJobs.length < jobs.length) {
    writeJobsToFile(filteredJobs);
    console.log(`Cleaned up ${jobs.length - filteredJobs.length} canceled jobs`);
  }
}

// Store an active job in memory
export function storeActiveJob(id: string, job: Job): void {
  activeJobs[id] = job;
}

// Get an active job from memory
export function getActiveJob(id: string): Job | undefined {
  return activeJobs[id];
}

// Initialize all stored jobs on server start
export function initializeStoredJobs(jobHandler: (id: string, scriptPath: string) => void): void {
  const jobs = readJobsFromFile();
  
  // First, clean up canceled jobs
  cleanupCanceledJobs();
  
  jobs.forEach(jobData => {
    // Skip jobs that are marked as canceled or are missing critical data
    if (jobData.canceled || !jobData.scriptPath || !jobData.cronExpression) {
      console.log(`Skipping initialization of job ${jobData.id} - canceled or invalid configuration`);
      return;
    }
    
    if (jobData.status === 'scheduled' || !jobData.status) {
      try {
        // Reschedule the job
        const job = scheduleJob(jobData.cronExpression, () => {
          if (jobData.scriptPath) {
            // Always check if the job is still valid before executing
            const currentJobData = getJobFromFile(jobData.id);
            if (currentJobData && !currentJobData.canceled) {
              jobHandler(jobData.id, jobData.scriptPath);
            } else {
              console.log(`Skipping execution of job ${jobData.id} - job no longer exists or was canceled`);
            }
          }
        });
        
        // Store the active job
        storeActiveJob(jobData.id, job);
        
        // Update the next run time
        const nextRun = job.nextInvocation();
        if (nextRun) {
          jobData.nextRun = nextRun.toISOString();
          storeJobToFile(jobData);
        }
      } catch (error) {
        console.error(`Error rescheduling job ${jobData.id}:`, error);
      }
    }
  });
}

// Log dosyasının varlığını kontrol eden fonksiyon
function jobHasLogs(jobId: string): boolean {
  const logPath = getLogFilePath(jobId);
  return fs.existsSync(logPath);
} 