import { Metadata } from "next";
import UserTable from "@/components/userTable";

export const metadata: Metadata = {
  title: "Settings",
  description: "Settings",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function Settings() {
  return (
    <div className="w-full h-full mx-auto">
      <UserTable />
    </div>
  );
}
