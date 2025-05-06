import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_CRON, CRON_DESCRIPTION, DATE_DESCRIPTION, DATE_FORMAT_GUIDE } from "./info";
import { Loader2 } from "lucide-react";

interface ScheduledFormProps {
  onSave: (data: { cronExpression: string; dateString: string; fireDate: Date | null }) => void;
  isLoading?: boolean;
}

export function ScheduledForm({ onSave, isLoading = false }: ScheduledFormProps) {
  const date = new Date();
  const [cronExpression, setCronExpression] = useState(DEFAULT_CRON);
  const [dateString, setDateString] = useState(
    `${date.getFullYear()}, ${date.getMonth()}, ${date.getDate()}, ${
      date.getHours() + 1
    }, ${date.getMinutes()}, ${date.getSeconds()}`
  );

  const parseFireDate = () => {
    try {
      const parts = dateString
        .split(",")
        .map((part) => parseInt(part.trim(), 10));

      if (parts.length >= 6) {
        const [year, month, day, hour, minute, second] = parts;
        return new Date(year, month, day, hour, minute, second);
      }
      return null;
    } catch (error) {
      console.error("Error parsing date string:", error);
      return null;
    }
  };

  const handleSave = () => {
    const fireDate = parseFireDate();
    onSave({
      cronExpression,
      dateString,
      fireDate,
    });
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="cron-input" className="text-sm font-medium">
              Cron Expression
            </label>
            <p className="text-xs text-muted-foreground">
              {CRON_DESCRIPTION}
            </p>
            <Input
              id="cron-input"
              type="text"
              placeholder="0 0 * * *"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              className="font-mono"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Enter a valid cron expression to schedule your task
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="date-input" className="text-sm font-medium">
              Fire Date (year, month, day, hour, minute, second)
            </label>
            <p className="text-xs text-muted-foreground">
              {DATE_DESCRIPTION}
            </p>
            <Input
              id="date-input"
              type="text"
              placeholder="2023, 11, 1, 12, 0, 0"
              value={dateString}
              onChange={(e) => setDateString(e.target.value)}
              className="font-mono"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {DATE_FORMAT_GUIDE}
            </p>

            <div className="mt-2 p-2 bg-muted rounded-md border text-xs font-mono">
              {parseFireDate() && (
                <div className="mt-1 text-muted-foreground">
                  Resolves to: {parseFireDate()?.toString()}
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            className="w-full sm:w-auto" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              "Set Schedule"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 