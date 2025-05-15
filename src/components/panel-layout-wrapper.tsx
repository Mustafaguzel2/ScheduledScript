"use client";

import { useState, Suspense } from "react";
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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Suspense fallback={<div className="h-screen w-20 bg-card animate-pulse"></div>}>
        <Sidebar collapsed={isCollapsed} onCollapsedChange={setIsCollapsed} />
      </Suspense>
      {/* Main content - scrollable */}
      <main className="flex-1 overflow-y-auto h-full">
        <ToastProvider>
          <Suspense fallback={<div className="w-full h-full animate-pulse bg-background rounded-lg"></div>}>
            {children}
          </Suspense>
          <Toaster />
        </ToastProvider>
      </main>
    </div>
  );
}
