import { Metadata } from "next";
import DashboardPage from "@/components/dashboard/DashboardPage";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function Settings() {
  return (
    <div className="w-full h-full px-8 py-2 space-y-4">
      <div className="flex flex-col p-2 gap-1">
        <h1 className="font-semibold text-2xl text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your dashboard
        </p>
      </div>
      <DashboardPage />
    </div>
  );
}
