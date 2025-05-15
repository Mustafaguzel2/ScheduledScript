import { Metadata } from "next";
import UserTable from "../../../components/settings/userTable";

export const metadata: Metadata = {
  title: "Settings",
  description: "Settings",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function Settings() {
  return (
    <div className="w-full h-full px-8 py-2 space-y-4">
      <div className="flex flex-col p-2 gap-1">
        <h1 className="font-semibold text-2xl text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your users
        </p>
      </div>
      <UserTable />
    </div>
  );
}
