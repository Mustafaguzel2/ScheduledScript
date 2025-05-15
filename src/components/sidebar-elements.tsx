import Link from "next/link";
import {
  Settings2Icon,
  FileSlidersIcon,
  ChartNoAxesCombinedIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

interface SidebarElements {
  isCollapsed?: boolean;
}

export default function SidebarElements({
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
  const items = [
    { label: "Dashboard", href: "/panel", icon: <ChartNoAxesCombinedIcon className="w-6 h-6"/> },
    { label: "Configurator", href: getHrefWithParams('/panel/configurator'), icon: <FileSlidersIcon className="w-6 h-6"/> },
    { label: "Settings", href: "/panel/settings", icon: <Settings2Icon className="w-6 h-6"/>},
  ];

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="align">
          <Link href={item.href}>
            <div 
             className={`flex gap-4
              text-muted-foreground hover:text-primary
              p-2
              rounded-lg
              ${isCollapsed ? "justify-center" : ""}
             `}
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
