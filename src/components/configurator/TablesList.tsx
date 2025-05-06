import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TableInfo } from "@/app/api/utils/db";

type Table = {
  id: string;
  name: string;
  schema: string;
};

type TablesListProps = {
  tables: Table[];
};

export function TablesList({ tables }: TablesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 50);
  const [tableDetails, setTableDetails] = useState<TableInfo[]>([]);

  const filteredTables = tables.filter((table) =>
    `${table.schema}.${table.name}`
      .toLowerCase()
      .includes(debouncedSearch.toLowerCase())
  );
  const fetchTableDetails = async () => {
    try {
      const response = await fetch("/api/tables/details");
      if (!response.ok) {
        throw new Error("Failed to fetch table details");
      }
      const data = await response.json();
      setTableDetails(data);
    } catch (error) {
      console.error("Error fetching table details:", error);
    }
  };

  useEffect(() => {
    fetchTableDetails();
  }, []);

  const getTableColumns = (schema: string, name: string) => {
    const found = tableDetails.find(
      (table) => table.schema === schema && table.table === name
    );
    return found?.columns || [];
  };

  return (
    <Card className="w-full h-full min-w-[200px]">
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
          {filteredTables.map((table) => {
            const columns = getTableColumns(table.schema, table.name);

            return (
              <TooltipProvider key={table.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="px-4 py-2 rounded-md text-sm hover:bg-muted/50 cursor-pointer">
                      <div className="font-medium">{table.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {table.schema}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px] p-2 bg-popover text-popover-foreground border border-border shadow-lg">
                    <div className="space-y-1">
                      <div className="font-medium mb-1">Columns:</div>
                      {columns.length > 0 ? (
                        <div className="space-y-1">
                          {columns.map((column) => (
                            <div key={column.column_name} className="text-xs">
                              <span className="font-medium">
                                {column.column_name}
                              </span>
                              <span className="text-muted-foreground ml-2">
                                ({column.data_type})
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          Loading columns...
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
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
