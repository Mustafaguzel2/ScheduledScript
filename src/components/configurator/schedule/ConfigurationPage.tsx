"use client";

import { TablesList } from "../../../components/configurator/TablesList";
import { useEffect, useState } from "react";
import LoadingAnimation from "../../../components/loadingAnimation";
import WorkerStarter from "../../../components/configurator/WorkStarter";

type Table = {
  id: string;
  name: string;
  schema: string;
};

export default function ConfiguratorPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    error: string;
    details?: string;
  } | null>(null);

  async function fetchTables() {
    try {
      const response = await fetch("/api/tables/list");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.details || data.error || "Failed to fetch tables");
      }

      const data = await response.json();
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

  useEffect(() => {
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
    <div className="p-4 md:p-6 w-full h-full">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="sm:col-span-6 lg:col-span-4 xl:col-span-3 col-span-2 overflow-auto">
          <div className="sticky">
            <TablesList tables={tables} />
          </div>
        </div>
        <div className="sm:col-span-6 lg:col-span-8 xl:col-span-9 col-span-11 flex justify-center items-start">
          <div className="w-full max-w-4xl">
            <WorkerStarter />
          </div>
        </div>
      </div>
    </div>
  );
}
