import { Metadata } from "next";
import { Suspense } from "react";
import WorkStarter from "../../../components/configurator/WorkStarter";
import LoadingAnimation from "../../../components/loadingAnimation";

export const metadata: Metadata = {
  title: "Configurator",
  description: "Configurator",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function Configurator() {
  return (
    <div className="w-full h-full px-8 py-2 space-y-4">
      <div className="flex flex-col p-2 gap-1">
        <h1 className="font-semibold text-2xl text-foreground">
          Configurator
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage parameters and scheduled jobs
        </p>
      </div>
      <Suspense fallback={<LoadingAnimation />}>
        <WorkStarter />
      </Suspense>
    </div>
  );
}
