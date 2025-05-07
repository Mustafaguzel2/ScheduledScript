'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { CronFormatReference } from './CronFormatReference';

interface JobFormProps {
  onSchedule: (jobData: { cronExpression: string; scriptName: string }) => Promise<unknown>;
  isLoading?: boolean;
}

export function JobForm({ onSchedule, isLoading = false }: JobFormProps) {
  const [cronExpression, setCronExpression] = useState<string>('');
  const [scriptName, setScriptName] = useState<string>('example.py');
  const [isCronHelpOpen, setIsCronHelpOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();

  // Mutation to schedule a new job
  const scheduleMutation = useMutation({
    mutationFn: ({ cronExpression, scriptName }: { cronExpression: string, scriptName: string }) => 
      onSchedule({ cronExpression, scriptName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledJobs'] });
      setCronExpression('');
      toast.success('Job scheduled successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to schedule job: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cronExpression) {
      toast.error('Cron expression is required');
      return;
    }
    if (!scriptName) {
      toast.error('Script name is required');
      return;
    }
    
    scheduleMutation.mutate({ cronExpression, scriptName });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Schedule New Job</CardTitle>
          <CardDescription>Enter a cron expression to schedule a new job</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="cronExpression">Cron Expression</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsCronHelpOpen(!isCronHelpOpen)}
                  disabled={isLoading || scheduleMutation.isPending}
                >
                  {isCronHelpOpen ? 'Hide Help' : 'Show Help'}
                </Button>
              </div>
              <Input
                id="cronExpression"
                placeholder="* * * * *"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                required
                disabled={isLoading || scheduleMutation.isPending}
              />
              <p className="text-sm text-muted-foreground">
                Format: minute hour day-of-month month day-of-week
              </p>
            </div>

            <CronFormatReference 
              isExpanded={isCronHelpOpen} 
              onToggle={() => setIsCronHelpOpen(!isCronHelpOpen)} 
            />

            <div className="space-y-2">
              <Label htmlFor="scriptName">Script Name</Label>
              <Input
                id="scriptName"
                placeholder="example.py"
                value={scriptName}
                onChange={(e) => setScriptName(e.target.value)}
                disabled={isLoading || scheduleMutation.isPending}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || scheduleMutation.isPending}>
              {isLoading || scheduleMutation.isPending ? 'Scheduling...' : 'Schedule Job'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
} 