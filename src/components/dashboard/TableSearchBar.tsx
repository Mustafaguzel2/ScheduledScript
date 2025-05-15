import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TableSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function TableSearchBar({ value, onChange }: TableSearchBarProps) {
  return (
    <div className="sticky top-0 backdrop-blur-md p-2 py-4 border-b border-border z-10">
      <div className="w-full">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            placeholder="Search tables..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-10 bg-background shadow-sm border-2"
          />
        </div>
      </div>
    </div>
  );
} 