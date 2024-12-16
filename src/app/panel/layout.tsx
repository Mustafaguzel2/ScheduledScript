import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/toast";
import Sidebar from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex bg-background">
      <Sidebar />
      <ToastProvider>
        <div className="flex w-screen min-h-screen p-10 pl-20 break-words">{children}</div>
        <Toaster />
      </ToastProvider>
    </div>
  );
}
