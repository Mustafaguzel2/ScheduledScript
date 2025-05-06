import { useState } from "react";
import { CronFormatReference } from "./CronFormatReference";
import { DateFormatReference } from "./DateFormatReference";
import { ScheduledForm } from "./ScheduledForm";
import { toast } from "@/hooks/use-toast";

export default function ScheduledStart() {
  const [expandedSection, setExpandedSection] = useState<
    "cron" | "date" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Toggle accordion section
  const toggleSection = (section: "cron" | "date") => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const handleSave = async (data: {
    cronExpression: string;
    dateString: string;
    fireDate: Date | null;
  }) => {
    console.log("Cron Expression:", data.cronExpression);
    console.log("Date String:", data.dateString);
    console.log("Fire Date:", data.fireDate);
  };

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-xl font-semibold tracking-tight mb-4">
        Scheduled Start
      </h2>

      <ScheduledForm onSave={handleSave} isLoading={isLoading} />

      <CronFormatReference
        isExpanded={expandedSection === "cron"}
        onToggle={() => toggleSection("cron")}
      />
      
      <DateFormatReference
        isExpanded={expandedSection === "date"}
        onToggle={() => toggleSection("date")}
      />
    </div>
  );
}
