import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Settings2Icon,
  FileSlidersIcon,
  HomeIcon,
  ChartNoAxesCombinedIcon,
} from "lucide-react";
interface SidebarElements {
  className?: string;
  isCollapsed?: boolean;
}

export default function SidebarElements({
  className,
  isCollapsed,
}: SidebarElements) {
  return (
    <div
      className={`flex items-center justify-start flex-col space-y-2 text-secondary ${
        className || ""
      }`}
    >
      <Button
        variant="ghost"
        className="flex items-center gap-3"
        title="Home"
        asChild
      >
        <Link href="/panel">
          <HomeIcon className="w-12 h-12" />
          {!isCollapsed && (
            <span className="text-lg  md:inline md:text-xl">Home</span>
          )}
        </Link>
      </Button>
      <Button
        variant="ghost"
        className="flex items-center gap-3"
        title="Dashboard"
        asChild
      >
        <Link href="/panel/dashboard">
          <ChartNoAxesCombinedIcon className="w-12 h-12" />
          {!isCollapsed && (
            <span className="text-lg  md:inline md:text-xl">Dashboard</span>
          )}
        </Link>
      </Button>
      <Button
        variant="ghost"
        className="flex items-center gap-3"
        title="Configurator"
        asChild
      >
        <Link href="/panel/configurator">
          <FileSlidersIcon className="w-12 h-12" />
          {!isCollapsed && (
            <span className="text-lg md:inline md:text-xl">Configurator</span>
          )}
        </Link>
      </Button>
      <Button
        variant="ghost"
        className="flex items-center gap-3"
        title="Settings"
        asChild
      >
        <Link href="/panel/settings">
          <Settings2Icon className="w-12 h-12" />
          {!isCollapsed && (
            <span className="text-lg md:inline md:text-xl">Settings</span>
          )}
        </Link>
      </Button>
    </div>
  );
}
