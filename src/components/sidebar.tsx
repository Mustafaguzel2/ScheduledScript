"use client";
import Logout from "./logout";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import SidebarElements from "./sidebar-elements";
import Link from "next/link";

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export default function Sidebar({
  collapsed,
  onCollapsedChange,
}: SidebarProps) {
  return (
    <aside 
      className={`h-full border-r border bg-card flex flex-col px-4 py-2 gap-4
       ${collapsed ? "w-20" : "w-64"} 
       bg-gradient-to-br
       from-[hsl(var(--primary)/0.15)]
       to-[hsl(var(--accent)/0.05)]
       `}
      >
      {/* Header */}
      <div className={`flex p-2 ${!collapsed ? "flex-row justify-between gap-8" : "flex-col items-center"}`}>
        <Link href="/panel">
          <span className="text-2xl font-bold text-primary">
            {!collapsed ? "X-Ops Tools" : "X"}
          </span>
        </Link>
        <Button
          variant="ghost"
          className="rounded-full h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={() => onCollapsedChange(!collapsed)}
        >
          <ArrowLeft
            className={`transition-transform ${
              collapsed ? "rotate-180" : "rotate-0"
            }`}
          />
        </Button>
      </div>
      <hr className="border-t border-primary/40" />
      {/* Navigation */}
      <nav className="flex-grow">
        <SidebarElements isCollapsed={collapsed} />
      </nav>

      {/* Footer */}
      <Logout isCollapsed={collapsed} />
    </aside>
  );
}
