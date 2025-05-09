import { Metadata } from "next";
import ConfiguratorPage from "@/components/configurator/schedule/ConfigurationPage";

export const metadata: Metadata = {
  title: "Configurator",
  description: "Configurator",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function Configurator() {
  return (
    <div>
      <ConfiguratorPage />
    </div>
  );
}
