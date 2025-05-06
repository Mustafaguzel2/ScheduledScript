import { useState } from "react";
import { CronFormatReference } from "./CronFormatReference";
import { ScheduledForm } from "./ScheduledForm";
import { toast } from "@/hooks/use-toast";
export default function ScheduledStart() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const startScheduledJob = async (data: { cronExpression: string }) => {
    const response = await fetch("/api/start-scheduled-job", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const responseData = await response.json();
    if (response.ok) {
      toast({
        title: "Scheduled job started",
        description: "The scheduled job has been started",
      });
    } else {
      toast({
        title: "Error starting scheduled job",
        description: "The scheduled job has not been started",
      });
    }
    return responseData;
  };

  const handleSave = async (data: { cronExpression: string }) => {
    console.log("Cron Expression:", data.cronExpression);
    try {
      setIsLoading(true);
      await startScheduledJob(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error starting scheduled job:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-xl font-semibold tracking-tight mb-4">
        Scheduled Start
      </h2>

      <ScheduledForm onSave={handleSave} isLoading={isLoading} />

      <CronFormatReference
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded((prev) => !prev)}
      />
    </div>
  );
}
