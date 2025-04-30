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
    <div className="w-full h-full mx-auto">
      <DashboardPage />
    </div>
  );
}
