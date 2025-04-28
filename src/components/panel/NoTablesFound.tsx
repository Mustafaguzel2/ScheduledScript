import { Search } from "lucide-react";

export function NoTablesFound() {
  return (
    <div className="mt-8 w-full flex items-center justify-center">
      <div className="flex flex-col items-center max-w-md text-center px-4">
        <div className="rounded-full bg-muted p-4 mb-4 ring-1 ring-muted/20">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-muted-foreground mb-1.5">
          No tables found
        </h3>
        <p className="text-sm text-muted-foreground">
          No tables match your search criteria. Try adjusting your search term.
        </p>
      </div>
    </div>
  );
} 