"use client";

import ParameterStart from "./ParameterStart";
import ScheduledStart from "./ScheduledStart";
import { useState, useEffect, useRef } from "react";
import TabButton from "@/components/tabButton";
import { useRouter, useSearchParams } from "next/navigation";

// Define type for tab values
type TabType = "parameter" | "scheduled";

export default function WorkerStarter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRender = useRef(true);

  // Get tab from URL or default to "parameter"
  const getInitialTab = (): TabType => {
    const tabParam = searchParams.get("tab");
    return tabParam === "scheduled" ? "scheduled" : "parameter";
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);

    // Update URL with new tab parameter
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    router.replace(url.pathname + url.search);
  };

  // Sync tab state with URL parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType | null;

    if (tabParam === "scheduled" || tabParam === "parameter") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Set default tab on initial render if none exists
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

  // Map tabs to their respective components
  const tabComponents: Record<TabType, React.ReactNode> = {
    parameter: <ParameterStart />,
    scheduled: <ScheduledStart />,
  };

  return (
    <div className="w-full bg-card rounded-lg border shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-2xl font-semibold tracking-tight">
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

        {/* Tab content */}
        <div className="mt-2 w-full flex flex-col justify-center space-y-6">
          <div
            id="parameter-panel"
            role="tabpanel"
            aria-labelledby="parameter-tab"
            hidden={activeTab !== "parameter"}
          >
            {activeTab === "parameter" && tabComponents.parameter}
          </div>
          <div
            id="scheduled-panel"
            role="tabpanel"
            aria-labelledby="scheduled-tab"
            hidden={activeTab !== "scheduled"}
          >
            {activeTab === "scheduled" && tabComponents.scheduled}
          </div>
        </div>
      </div>
    </div>
  );
}
