import { Metadata } from 'next';
import ScheduledJobsManager from '@/components/configurator/schedule/ScheduledJobsManager';

export const metadata: Metadata = {
  title: 'Scheduled Jobs Management',
  description: 'View, create, and manage scheduled jobs',
};

export default function JobsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Scheduled Jobs</h1>
      <ScheduledJobsManager />
    </div>
  );
} 