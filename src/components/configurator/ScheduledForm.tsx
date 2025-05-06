import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_CRON, CRON_DESCRIPTION } from "./info";
import { Loader2 } from "lucide-react";

type ScheduledFormProps = {
  onSave: (data: { cronExpression: string }) => void;
  isLoading?: boolean;
};

export function ScheduledForm({ onSave, isLoading }: ScheduledFormProps) {
  const [cronExpression, setCronExpression] = useState(DEFAULT_CRON);

  const handleSave = () => {
    onSave({
      cronExpression,
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
            <p className="text-xs text-muted-foreground">{CRON_DESCRIPTION}</p>
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
