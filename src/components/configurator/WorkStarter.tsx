"use client";

import ParameterStart from "./parameter/ParameterStart";
import { useState, useEffect, useRef } from "react";
import TabButton from "@/components/tabButton";
import { useRouter, useSearchParams } from "next/navigation";
import ScheduledJobsManager from "./schedule/ScheduledJobsManager";

type TabType = "parameter" | "scheduled";

export default function WorkerStarter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRender = useRef(true);

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
      <div className="p-4">
        {/* Tab navigation */}
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

        <div className="w-full">
          <div className="w-full">
            <div
              id="parameter-panel"
              role="tabpanel"
              aria-labelledby="parameter-tab"
              className="w-full"
              hidden={activeTab !== "parameter"}
              style={{ display: activeTab !== "parameter" ? "none" : "block" }}
            >
              {activeTab === "parameter" && tabComponents.parameter}
            </div>
            <div
              id="scheduled-panel"
              role="tabpanel"
              aria-labelledby="scheduled-tab"
              className="w-full"
              hidden={activeTab !== "scheduled"}
              style={{ display: activeTab !== "scheduled" ? "none" : "block" }}
            >
              {activeTab === "scheduled" && tabComponents.scheduled}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
