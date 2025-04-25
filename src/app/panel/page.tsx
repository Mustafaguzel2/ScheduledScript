"use client";

import { useEffect, useState } from "react";
import LoadingAnimation from "@/components/loadingAnimation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

interface TableInfo {
  schema: string;
  table: string;
  columns: TableColumn[];
  data: Record<string, string | number | boolean | null>[];
}

export default function PanelPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    error: string;
    details?: string;
  } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedColumns, setSelectedColumns] = useState<
    Record<string, string[]>
  >({});
  const [dataFilters, setDataFilters] = useState<Record<string, string>>({});
  const [tableSearch, setTableSearch] = useState("");
  
  const debouncedTableSearch = useDebounce(tableSearch, 500);
  const debouncedFilters = useDebounce(filters, 500);
  const debouncedDataFilters = useDebounce(dataFilters, 500);

  useEffect(() => {
    async function fetchTables() {
      try {
        const response = await fetch("/api/tables");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.details || data.error || "Failed to fetch tables"
          );
        }

        setTables(data.tables);
      } catch (err) {
        setError({
          error: "Connection Error",
          details:
            err instanceof Error ? err.message : "An unknown error occurred",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchTables();
  }, []);

  const handleFilterChange = (tableKey: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [tableKey]: value.toLowerCase(),
    }));
  };

  const filterColumns = (columns: TableColumn[], filter: string) => {
    if (!filter) return columns;
    return columns.filter(
      (column) =>
        column.column_name.toLowerCase().includes(filter) ||
        column.data_type.toLowerCase().includes(filter)
    );
  };

  const handleColumnSelection = (
    tableKey: string,
    columnName: string,
    checked: boolean
  ) => {
    setSelectedColumns((prev) => {
      const currentSelected = prev[tableKey] || [];
      const newSelected = checked
        ? [...currentSelected, columnName]
        : currentSelected.filter((col) => col !== columnName);

      return {
        ...prev,
        [tableKey]: newSelected,
      };
    });
  };

  const handleDataFilterChange = (tableKey: string, value: string) => {
    setDataFilters((prev) => ({
      ...prev,
      [tableKey]: value.toLowerCase(),
    }));
  };

  const filterData = (data: Record<string, string | number | boolean | null>[], filter: string) => {
    if (!filter) return data;
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(filter)
      )
    );
  };

  const filteredTables = tables.filter(table => 
    `${table.schema}.${table.table}`.toLowerCase().includes(debouncedTableSearch.toLowerCase())
  );

  if (loading) return <LoadingAnimation />;

  if (error)
    return (
      <div className="p-4">
        <div
          className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg"
          role="alert"
        >
          <strong className="font-bold">{error.error}</strong>
          <p className="text-sm">{error.details}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen w-full">
      <div className="w-full h-full flex flex-col">
        <div className="sticky top-0 backdrop-blur-sm py-4 border-b border-border z-10">
          <div className="w-full px-6 ml-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                placeholder="Search tables..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-10 bg-background shadow-sm border-2"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 w-full">
          <div className="h-full w-full px-6 ml-4">
            {filteredTables.length > 0 ? (
              <div className="py-6 space-y-6">
                {filteredTables.map((tableInfo, index) => {
                  const tableKey = `${tableInfo.schema}.${tableInfo.table}`;
                  const selectedCols = selectedColumns[tableKey] || [];
                  
                  return (
                    <Card key={index} className="overflow-hidden border-2">
                      <CardHeader className="bg-muted/30 border-b-2">
                        <CardTitle className="text-lg text-foreground">
                          {tableInfo.schema}.{tableInfo.table}
                        </CardTitle>
                      </CardHeader>
                      <div className="p-6">
                        <div className="grid grid-cols-12 gap-6">
                          {/* Table structure */}
                          <div className="col-span-3">
                            <div className="flex flex-col gap-4">
                              <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                  Structure
                                </h3>
                                <Input
                                  placeholder="Filter columns..."
                                  value={filters[tableKey] || ""}
                                  onChange={(e) => handleFilterChange(tableKey, e.target.value)}
                                  className="mb-4 border-2"
                                />
                              </div>
                              <div className="overflow-x-auto border-2 rounded-lg">
                                <div className="max-h-[400px] overflow-y-auto">
                                  <table className="w-full">
                                    <thead className="bg-muted/50 border-b border-border">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                          Select
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                          Column
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                          Type
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                      {filterColumns(tableInfo.columns, debouncedFilters[tableKey] || '').map((column, colIndex) => (
                                        <tr
                                          key={colIndex}
                                          className="hover:bg-muted/50 transition-colors"
                                        >
                                          <td className="px-4 py-2">
                                            <Checkbox
                                              id={`${tableKey}-${column.column_name}`}
                                              checked={selectedCols.includes(
                                                column.column_name
                                              )}
                                              onCheckedChange={(checked: boolean) =>
                                                handleColumnSelection(
                                                  tableKey,
                                                  column.column_name,
                                                  checked as boolean
                                                )
                                              }
                                            />
                                          </td>
                                          <td className="px-4 py-2 text-xs">
                                            <Label
                                              htmlFor={`${tableKey}-${column.column_name}`}
                                            >
                                              {column.column_name}
                                            </Label>
                                          </td>
                                          <td className="px-4 py-2 text-xs text-muted-foreground">
                                            {column.data_type}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Table data */}
                          <div className="col-span-9">
                            <div className="flex flex-col gap-4">
                              <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                  Data
                                </h3>
                                <Input
                                  placeholder="Filter data..."
                                  value={dataFilters[tableKey] || ""}
                                  onChange={(e) => handleDataFilterChange(tableKey, e.target.value)}
                                  className="mb-4 border-2"
                                />
                              </div>
                              <div className="overflow-x-auto border-2 rounded-lg">
                                <div className="max-h-[400px] overflow-y-auto">
                                  <table className="w-full">
                                    <thead className="bg-muted/50 border-b border-border">
                                      <tr>
                                        {tableInfo.columns
                                          .filter(
                                            (column) =>
                                              selectedCols.length === 0 ||
                                              selectedCols.includes(column.column_name)
                                          )
                                          .map((column, colIndex) => (
                                            <th
                                              key={colIndex}
                                              className="px-4 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap sticky top-0 bg-muted/50"
                                            >
                                              {column.column_name}
                                            </th>
                                          ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                      {filterData(tableInfo.data, debouncedDataFilters[tableKey] || '').map((row, rowIndex) => (
                                        <tr
                                          key={rowIndex}
                                          className="hover:bg-muted/50 transition-colors"
                                        >
                                          {tableInfo.columns
                                            .filter(
                                              (column) =>
                                                selectedCols.length === 0 ||
                                                selectedCols.includes(column.column_name)
                                            )
                                            .map((column, colIndex) => (
                                              <td
                                                key={colIndex}
                                                className="px-4 py-2 text-sm whitespace-nowrap"
                                              >
                                                {String(row[column.column_name] ?? "")}
                                              </td>
                                            ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
