import {
  DATE_FORMAT_INTRO,
  DATE_FORMAT_CODE,
  DATE_EXAMPLES,
  DATE_REFERENCE_TITLE,
} from "./info";
import { FormatAccordion } from "./FormatAccordion";

interface DateFormatReferenceProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function DateFormatReference({
  isExpanded,
  onToggle,
}: DateFormatReferenceProps) {
  return (
    <FormatAccordion
      title={DATE_REFERENCE_TITLE}
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <p className="text-sm text-muted-foreground mb-3">
        {DATE_FORMAT_INTRO}
      </p>

      <div className="bg-background border p-3 rounded-md text-xs font-mono whitespace-pre overflow-x-auto text-foreground">
        <div>
          <span className="text-green-600">{DATE_FORMAT_CODE.format}</span>
        </div>
        <div>{DATE_FORMAT_CODE.syntax}</div>
        <div className="mt-2">
          <span className="text-green-600">{DATE_FORMAT_CODE.example}</span>
        </div>
        <div>{DATE_FORMAT_CODE.exampleCode}</div>
        <div className="mt-1 text-muted-foreground">
          {DATE_FORMAT_CODE.exampleResult}
        </div>
        <div className="mt-2 text-muted-foreground">
          <span className="text-yellow-600">{DATE_FORMAT_CODE.note.split(':')[0]}:</span>{" "}
          {DATE_FORMAT_CODE.note.split(':')[1]}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {DATE_EXAMPLES.map((example, index) => (
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