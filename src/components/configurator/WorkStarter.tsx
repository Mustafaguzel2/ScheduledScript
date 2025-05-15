"use client";

import ParameterStart from "./parameter/ParameterStart";
import { useState, useEffect, useRef } from "react";
import TabButton from "../../components/tabButton";
import { useRouter, useSearchParams } from "next/navigation";
import ScheduledJobsManager from "./schedule/ScheduledJobsManager";
import { TablesList } from "../../components/configurator/TablesList";

type TabType = "parameter" | "scheduled";

type Table = {
  id: string;
  name: string;
  schema: string;
};

export default function WorkerStarter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRender = useRef(true);
  const [tables, setTables] = useState<Table[]>([]);

  const getInitialTab = (): TabType => {
    const tabParam = searchParams.get("tab");
    return tabParam === "scheduled" ? "scheduled" : "parameter";
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);

    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    router.replace(url.pathname + url.search);
  };

  // Fetch tables data
  async function fetchTables() {
    try {
      const response = await fetch("/api/tables/list");
      if (!response.ok) {
        throw new Error("Failed to fetch tables");
      }

      const data = await response.json();
      setTables(data.tables || []);
    } catch (err) {
      console.error("Error fetching tables:", err);
    }
  }

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType | null;

    if (tabParam === "scheduled" || tabParam === "parameter") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;

      const tabParam = searchParams.get("tab");
      if (!tabParam) {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", "parameter");
        router.replace(url.pathname + url.search);
      }
    }
  }, [router, searchParams]);

  const tabComponents: Record<TabType, React.ReactNode> = {
    parameter: <ParameterStart />,
    scheduled: <ScheduledJobsManager />,
  };

  return (
    <div className="w-full bg-card rounded-lg border shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-2xl font-semibold tracking-tight text-center">
          Worker Starter
        </h2>
      </div>
      <div className="p-6">
        {/* Tab navigation */}

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column - Tables list */}
          <div className="lg:col-span-4 xl:col-span-3">
            <TablesList tables={tables} />
          </div>

          {/* Right column - Tab content */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div
              className="flex space-x-1 rounded-md bg-muted p-1 mb-6"
              role="tablist"
              aria-label="Worker Starter Options"
            >
              <TabButton
                value="parameter"
                activeTab={activeTab}
                onClick={() => handleTabChange("parameter")}
                aria-controls="parameter-panel"
                aria-selected={activeTab === "parameter"}
              >
                Parameter
              </TabButton>

              <TabButton
                value="scheduled"
                activeTab={activeTab}
                onClick={() => handleTabChange("scheduled")}
                aria-controls="scheduled-panel"
                aria-selected={activeTab === "scheduled"}
              >
                Scheduled
              </TabButton>
            </div>

            <div
              id="parameter-panel"
              role="tabpanel"
              aria-labelledby="parameter-tab"
              className={`w-full min-h-[500px] ${
                activeTab !== "parameter" ? "hidden" : ""
              }`}
            >
              {activeTab === "parameter" && tabComponents.parameter}
            </div>
            <div
              id="scheduled-panel"
              role="tabpanel"
              aria-labelledby="scheduled-tab"
              className={`w-full min-h-[500px] ${
                activeTab !== "scheduled" ? "hidden" : ""
              }`}
            >
              {activeTab === "scheduled" && tabComponents.scheduled}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
