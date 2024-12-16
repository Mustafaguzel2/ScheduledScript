import { Metadata } from "next";
import UserTable from "@/components/user-table";

export const metadata: Metadata = {
  title: "Settings",
  description: "Settings",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function Settings() {
  return <UserTable />;
}
