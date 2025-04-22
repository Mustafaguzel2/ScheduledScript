"use client";

import { useEffect, useState } from "react";
import LoadingAnimation from "@/components/loadingAnimation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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
    <div className="max-w-[calc(100vw-16rem)] mx-auto px-6">
      <div className="space-y-6">
        {tables.map((tableInfo, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-lg">
                {tableInfo.schema}.{tableInfo.table}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-12 gap-4">
                {/* Table structure */}
                <div className="col-span-3">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Structure
                  </h3>
                  <div className="overflow-x-auto border rounded-lg border-border">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                            Column
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                            Type
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {tableInfo.columns.map((column, colIndex) => (
                          <tr
                            key={colIndex}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            <td className="px-4 py-2 text-xs">
                              {column.column_name}
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

                {/* Table data */}
                <div className="col-span-9">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Data
                  </h3>
                  <div
                    className="border rounded-lg border-border overflow-auto"
                    style={{ maxHeight: "500px" }}
                  >
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          {tableInfo.columns.map((column, colIndex) => (
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
                        {tableInfo.data.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            {tableInfo.columns.map((column, colIndex) => (
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
