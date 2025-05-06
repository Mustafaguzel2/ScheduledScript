'use client';

import { useQuery } from '@tanstack/react-query';
import { JobForm } from './JobForm';
import { JobList, JobData } from './JobList';

// Function to fetch all jobs
const fetchJobs = async (): Promise<JobData[]> => {
  const response = await fetch('/api/start-scheduled-job');
  const data = await response.json();
  return data.jobs || [];
};

// Function to schedule a new job
const scheduleJob = async (jobData: { cronExpression: string; scriptName: string }): Promise<JobData> => {
  const response = await fetch('/api/start-scheduled-job', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jobData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to schedule job');
  }
  
  const data = await response.json();
  return data.job;
};

// Function to delete a job
const deleteJob = async (id: string): Promise<void> => {
  const response = await fetch(`/api/start-scheduled-job?id=${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete job');
  }
};

export default function ScheduledJobsManager() {
  // Query to fetch all jobs
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['scheduledJobs'],
    queryFn: fetchJobs,
    refetchInterval: 600000, // 10 minutes
  });

  return (
    <div className="space-y-6">
      <JobForm onSchedule={scheduleJob} />
      <JobList 
        jobs={jobs} 
        isLoading={isLoading} 
        error={error as Error | null} 
        onDelete={deleteJob} 
      />
    </div>
  );
} 