import { Metadata } from "next";
import { Suspense } from "react";
import WorkStarter from "@/components/configurator/WorkStarter";

export const metadata: Metadata = {
  title: "Configurator",
  description: "Configurator",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function Configurator() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Configurator</h1>
        <p className="text-muted-foreground">Manage parameters and scheduled jobs</p>
      </div>
      
      <Suspense fallback={<div className="w-full h-[600px] bg-gray-200 rounded-lg animate-pulse"></div>}>
        <WorkStarter />
      </Suspense>
    </div>
  );
}
