"use client";

import { useEffect, useState } from "react";

interface TableInfo {
  schema: string;
  table: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export default function PanelPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorResponse | null>(null);

  useEffect(() => {
    async function fetchTables() {
      try {
        const response = await fetch("/api/tables");
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.details || data.error || "Failed to fetch tables");
        }
        
        setTables(data.tables);
      } catch (err) {
        setError({
          error: "Connection Error",
          details: err instanceof Error ? err.message : "An unknown error occurred"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchTables();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>
  );

  if (error) return (
    <div className="p-4">
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">{error.error}</strong>
        <p className="text-sm">{error.details}</p>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Database Tables</h1>
      <div className="grid gap-4">
        {tables.map((table, index) => (
          <div key={index} className="p-4 border rounded">
            <p>Schema: {table.schema}</p>
            <p>Table: {table.table}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
