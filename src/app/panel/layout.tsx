import type { Metadata } from "next";
import PanelLayoutWrapper from "@/components/panel-layout-wrapper";
import { Suspense } from "react";
import LoadingAnimation from "@/components/loadingAnimation";

export const metadata: Metadata = {
  title: {
    template: "%s | Main Panel | X-Ops",
    default: "Main Panel",
  },
  description: "All activities and dashboards are here",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <PanelLayoutWrapper>
      <Suspense fallback={<LoadingAnimation />}>
        {children}
      </Suspense>
    </PanelLayoutWrapper>
  );
}
