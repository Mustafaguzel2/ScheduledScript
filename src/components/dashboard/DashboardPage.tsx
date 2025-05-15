"use client";

import { useEffect, useState } from "react";
import LoadingAnimation from "@/components/loadingAnimation";
import { useDebounce } from "@/hooks/useDebounce";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { NoTablesFound } from "@/components/dashboard/NoTablesFound";
import { TableCard } from "@/components/dashboard/TableCard";
import { TableInfo } from "@/app/api/utils/db";

export default function DashboardPage() {
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
  const debouncedFilters = useDebounce(filters, 50);
  const debouncedDataFilters = useDebounce(dataFilters, 50);

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

  const filteredTables = tables.filter((table) =>
    `${table.schema}.${table.table}`
      .toLowerCase()
      .includes(debouncedTableSearch.toLowerCase())
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
        <TableSearchBar value={tableSearch} onChange={setTableSearch} />

        <div className="flex-1 w-full px-2 py-4">
          <div className="h-full w-full">
            {filteredTables.length > 0 ? (
              <div className="space-y-6">
                {filteredTables.map((tableInfo, index) => {
                  const tableKey = `${tableInfo.schema}.${tableInfo.table}`;
                  return (
                    <TableCard
                      key={index}
                      tableInfo={tableInfo}
                      selectedColumns={selectedColumns[tableKey] || []}
                      columnFilter={debouncedFilters[tableKey] || ""}
                      dataFilter={debouncedDataFilters[tableKey] || ""}
                      onColumnFilterChange={(value) =>
                        handleFilterChange(tableKey, value)
                      }
                      onDataFilterChange={(value) =>
                        handleDataFilterChange(tableKey, value)
                      }
                      onColumnSelection={(columnName, checked) =>
                        handleColumnSelection(tableKey, columnName, checked)
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <NoTablesFound />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
