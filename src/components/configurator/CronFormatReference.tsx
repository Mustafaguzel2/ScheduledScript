import {
  CRON_FORMAT_INTRO,
  CRON_FORMAT_DIAGRAM,
  CRON_EXAMPLES,
  CRON_REFERENCE_TITLE,
} from "./info";
import { FormatAccordion } from "./FormatAccordion";

interface CronFormatReferenceProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function CronFormatReference({
  isExpanded,
  onToggle,
}: CronFormatReferenceProps) {
  return (
    <FormatAccordion
      title={CRON_REFERENCE_TITLE}
      isExpanded={isExpanded}
      onToggle={onToggle}
      className="mb-6"
    >
      <p className="text-sm text-muted-foreground mb-3">
        {CRON_FORMAT_INTRO}
      </p>

      <pre className="bg-background border p-3 rounded-md text-xs font-mono whitespace-pre overflow-x-auto text-foreground">
        {CRON_FORMAT_DIAGRAM}
      </pre>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CRON_EXAMPLES.map((example, index) => (
          <div key={index} className="text-xs bg-background rounded p-2 border">
            <span className="font-medium">Example:</span>{" "}
            <code>{example.expression}</code>
            <p className="text-muted-foreground mt-1">
              {example.description}
            </p>
          </div>
        ))}
      </div>
    </FormatAccordion>
  );
} 