"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { JobForm } from "./JobForm";
import { JobList, JobData } from "./JobList";
import { useEffect } from "react";

export type ScheduledJobResponse = {
  id: string;
  cronExpression: string;
  status: "scheduled" | "running" | "completed" | "failed";
  created: string;
  lastRun?: string;
  nextRun?: string;
  scriptPath?: string;
  scriptName?: string;
  hasLogs?: boolean;
};

const fetchJobs = async (): Promise<ScheduledJobResponse[]> => {
  const response = await fetch("/api/jobs/start-scheduled-job");
  const data = await response.json();
  return data.jobs || [];
};

// Function to schedule a new job
const scheduleJob = async (jobData: {
  cronExpression: string;
  scriptName: string;
}): Promise<ScheduledJobResponse> => {
  try {
    const response = await fetch("/api/jobs/start-scheduled-job", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to schedule job");
    }

    const data = await response.json();
    return data.job;
  } catch (error) {
    console.error("Error scheduling job:", error);
    throw error;
  }
};

// Function to delete a job
const deleteJob = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/jobs/start-scheduled-job?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete job");
    }
  } catch (error) {
    console.error("Error deleting job:", error);
    throw error;
  }
};

export default function ScheduledJobsManager() {
  const queryClient = useQueryClient();

  // Query to fetch all jobs
  const {
    data: jobs,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["scheduledJobs"],
    queryFn: fetchJobs,
    refetchInterval: 60000,
    staleTime: 5000,
  });

  // Mutation for scheduling a job
  const scheduleMutation = useMutation({
    mutationFn: scheduleJob,
    onSuccess: () => {
      // Invalidate and refetch jobs after scheduling a new one
      queryClient.invalidateQueries({ queryKey: ["scheduledJobs"] });
    },
  });

  // Mutation for deleting a job
  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      // Invalidate and refetch jobs after deleting one
      queryClient.invalidateQueries({ queryKey: ["scheduledJobs"] });
    },
  });

  // Initial refetch when component mounts
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Handle scheduling a job
  const handleSchedule = async (jobData: {
    cronExpression: string;
    scriptName: string;
  }) => {
    try {
      await scheduleMutation.mutateAsync(jobData);
    } catch (error) {
      console.error("Error scheduling job:", error);
    }
  };

  // Handle deleting a job
  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  // Map the job data from the API to the format expected by JobList
  const mappedJobs: JobData[] =
    jobs?.map((job) => ({
      id: job.id,
      cronExpression: job.cronExpression,
      status: job.status,
      created: new Date(job.created),
      lastRun: job.lastRun ? new Date(job.lastRun) : undefined,
      nextRun: job.nextRun ? new Date(job.nextRun) : undefined,
      hasLogs: job.hasLogs,
    })) || [];

  return (
    <div className="flex flex-col gap-6 w-full">
      <JobForm
        onSchedule={handleSchedule}
        isLoading={scheduleMutation.isPending}
      />
      <JobList
        jobs={mappedJobs}
        isLoading={isLoading}
        error={error as Error | null}
        onDelete={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
