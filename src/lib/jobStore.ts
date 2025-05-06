import { Job } from 'node-schedule';

export interface ScheduledJob {
  id: string;
  cronExpression: string;
  job: Job;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  created: Date;
  lastRun?: Date;
  nextRun?: Date;
  scriptPath?: string;
  hasLogs?: boolean;
}

// In-memory store for scheduled jobs
const jobStore: Record<string, ScheduledJob> = {};

export function storeJob(id: string, cronExpression: string, job: Job, scriptPath?: string): ScheduledJob {
  const scheduledJob: ScheduledJob = {
    id,
    cronExpression,
    job,
    status: 'scheduled',
    created: new Date(),
    scriptPath,
    nextRun: job.nextInvocation(),
    hasLogs: true,
  };
  
  jobStore[id] = scheduledJob;
  return scheduledJob;
}

export function getJob(id: string): ScheduledJob | undefined {
  return jobStore[id];
}

export function getAllJobs(): ScheduledJob[] {
  return Object.values(jobStore);
}

export function updateJobStatus(id: string, status: ScheduledJob['status']): ScheduledJob | undefined {
  if (!jobStore[id]) return undefined;
  
  jobStore[id] = {
    ...jobStore[id],
    status,
    ...(status === 'running' ? { lastRun: new Date() } : {}),
    ...(status !== 'running' ? { nextRun: jobStore[id].job.nextInvocation() } : {})
  };
  
  return jobStore[id];
}

export function deleteJob(id: string): boolean {
  if (!jobStore[id]) return false;
  
  // Cancel the scheduled job
  const success = jobStore[id].job.cancel();
  if (success) {
    delete jobStore[id];
  }
  
  return success;
} 