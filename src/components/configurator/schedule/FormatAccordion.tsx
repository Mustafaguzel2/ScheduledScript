import { ReactNode } from "react";
import { InfoIcon, ChevronDown } from "lucide-react";

interface FormatAccordionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
}

export function FormatAccordion({
  title,
  isExpanded,
  onToggle,
  children,
  className = "",
}: FormatAccordionProps) {
  return (
    <div className={`rounded-lg border bg-card overflow-hidden ${className}`}>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 border-b focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <InfoIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isExpanded ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && <div className="p-4">{children}</div>}
    </div>
  );
} 