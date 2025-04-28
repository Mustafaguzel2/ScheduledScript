import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

interface Table {
  id: string;
  name: string;
  schema: string;
}

interface TablesListProps {
  tables: Table[];
}

export function TablesList({ tables }: TablesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 50);

  const filteredTables = tables.filter((table) =>
    `${table.schema}.${table.name}`
      .toLowerCase()
      .includes(debouncedSearch.toLowerCase())
  );

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Tables</CardTitle>
          <span className="text-sm text-muted-foreground">
            {filteredTables.length} of {tables.length} tables
          </span>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-[calc(100vh-280px)] min-h-[400px] overflow-y-auto pr-2">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              className="px-4 py-2 rounded-md text-sm hover:bg-muted/50"
            >
              <div className="font-medium">{table.name}</div>
              <div className="text-xs text-muted-foreground">{table.schema}</div>
            </div>
          ))}
          {filteredTables.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No tables found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 