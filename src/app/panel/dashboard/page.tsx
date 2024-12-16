import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function Dashboard() {
  return <div>Dashboard</div>;
}
