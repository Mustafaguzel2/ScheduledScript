import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Settings2Icon,
  FileSlidersIcon,
  ChartNoAxesCombinedIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

interface SidebarElements {
  className?: string;
  isCollapsed?: boolean;
}

export default function SidebarElements({
  className,
  isCollapsed,
}: SidebarElements) {
  const searchParams = useSearchParams();
  
  // Create a function to get the href with preserved query params
  const getHrefWithParams = (path: string) => {
    // Always preserve the tab parameter when navigating to configurator
    if (path === '/panel/configurator') {
      const tabParam = searchParams.get('tab');
      if (tabParam) {
        return `${path}?tab=${tabParam}`;
      }
    }
    return path;
  };

  return (
    <div
      className={`flex flex-col space-y-2 text-secondary-foreground ${
        className || ""
      }`}
    >
      <Button
        variant="ghost"
        className={`flex items-center text-secondary-foreground hover:text-secondary-foreground/80 hover:bg-secondary/10 ${
          isCollapsed ? "justify-center p-2" : "gap-3"
        }`}
        title="Dashboard"
        asChild
      >
        <Link href="/panel">
          <ChartNoAxesCombinedIcon
            className={`${isCollapsed ? "w-8 h-8" : "w-6 h-6"}`}
          />
          {!isCollapsed && (
            <span className="text-lg md:text-xl">Dashboard</span>
          )}
        </Link>
      </Button>
      <Button
        variant="ghost"
        className={`flex items-center text-secondary-foreground hover:text-secondary-foreground/80 hover:bg-secondary/10 ${
          isCollapsed ? "justify-center p-2" : "gap-3"
        }`}
        title="Configurator"
        asChild
      >
        <Link href={getHrefWithParams('/panel/configurator')}>
          <FileSlidersIcon
            className={`${isCollapsed ? "w-8 h-8" : "w-6 h-6"}`}
          />
          {!isCollapsed && (
            <span className="text-lg md:text-xl">Configurator</span>
          )}
        </Link>
      </Button>
      <Button
        variant="ghost"
        className={`flex items-center text-secondary-foreground hover:text-secondary-foreground/80 hover:bg-secondary/10 ${
          isCollapsed ? "justify-center p-2" : "gap-3"
        }`}
        title="Settings"
        asChild
      >
        <Link href="/panel/settings">
          <Settings2Icon className={`${isCollapsed ? "w-8 h-8" : "w-6 h-6"}`} />
          {!isCollapsed && <span className="text-lg md:text-xl">Settings</span>}
        </Link>
      </Button>
    </div>
  );
}
