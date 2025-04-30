"use client";

import { useState } from "react";
import { ToastProvider } from "@/components/ui/toast";
import Sidebar from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";

interface PanelLayoutWrapperProps {
  children: React.ReactNode;
}

export default function PanelLayoutWrapper({
  children,
}: PanelLayoutWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div
        className={`flex-none transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="fixed h-screen">
          <Sidebar collapsed={isCollapsed} onCollapsedChange={setIsCollapsed} />
        </div>
      </div>

      {/* Main content - scrollable */}
      <div className="flex-1 overflow-y-auto">
        <main className="h-full">
          <ToastProvider>
            <div
              className={`flex min-h-screen p-6 transition-all duration-300 ease-in-out ${
                isCollapsed ? "pl-8" : "pl-12"
              }`}
            >
              {children}
            </div>
            <Toaster />
          </ToastProvider>
        </main>
      </div>
    </div>
  );
}
