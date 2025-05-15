'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { LogEntry } from '../../../lib/logger';
import { ScrollArea } from '../../../components/ui/scroll-area';

interface JobLogViewerProps {
  jobId: string;
  buttonLabel?: string;
}

// Function to fetch job logs
const fetchJobLogs = async (jobId: string): Promise<LogEntry[]> => {
  const response = await fetch(`/api/jobs/job-logs?jobId=${jobId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch logs');
  }
  
  const data = await response.json();
  return data.logs;
};

export function JobLogViewer({ jobId, buttonLabel = 'View Logs' }: JobLogViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Query to fetch job logs
  const { 
    data: logs,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['jobLogs', jobId],
    queryFn: () => fetchJobLogs(jobId),
    enabled: false, // Don't fetch automatically
  });
  
  // Fetch logs when the dialog is opened
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);
  
  // Get log entry style based on log level
  const getLogLevelStyle = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-500';
      case 'success':
        return 'text-green-500';
      case 'info':
      default:
        return 'text-blue-500';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[725px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Job Logs - {jobId.substring(0, 8)}...</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] mt-2">
          {isLoading ? (
            <div className="py-4 text-center">Loading logs...</div>
          ) : error ? (
            <div className="py-4 text-center text-red-500">
              Error loading logs: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-2 font-mono text-sm">
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className="border p-2 rounded-sm"
                >
                  <div className="flex justify-between">
                    <span className={getLogLevelStyle(log.level)}>
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="text-gray-500">{log.timestamp}</span>
                  </div>
                  <div className="mt-1 whitespace-pre-wrap">{log.message}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center">No logs found for this job</div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 