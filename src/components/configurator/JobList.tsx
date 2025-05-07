'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { JobLogViewer } from './JobLogViewer';

export interface JobData {
  id: string;
  cronExpression: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'canceled';
  created: Date;
  lastRun?: Date;
  nextRun?: Date;
  hasLogs?: boolean;
}

interface JobListProps {
  jobs: JobData[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onDelete: (id: string) => Promise<void>;
  isDeleting?: boolean;
}

// Function to get a status badge color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'running':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'canceled':
      return 'bg-gray-500 text-white';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function JobList({ jobs, isLoading, error, onDelete, isDeleting = false }: JobListProps) {
  const queryClient = useQueryClient();

  // Mutation to delete a job
  const deleteMutation = useMutation({
    mutationFn: (id: string) => onDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledJobs'] });
      toast.success('Job deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete job: ${error.message}`);
    }
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this job?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Jobs</CardTitle>
        <CardDescription>Manage and monitor your scheduled jobs</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading jobs...</p>
        ) : error ? (
          <p className="text-red-500">Error loading jobs</p>
        ) : jobs && jobs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cron Expression</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job: JobData) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-xs">{job.id.substring(0, 8)}...</TableCell>
                  <TableCell className="font-mono">{job.cronExpression}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(job.created, 'PPp')}</TableCell>
                  <TableCell>{job.lastRun ? format(job.lastRun, 'PPp') : '-'}</TableCell>
                  <TableCell>{job.nextRun ? format(job.nextRun, 'PPp') : '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {job.hasLogs && (
                        <JobLogViewer jobId={job.id} />
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(job.id)}
                        disabled={deleteMutation.isPending || isDeleting}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center py-4">No scheduled jobs found</p>
        )}
      </CardContent>
    </Card>
  );
} 