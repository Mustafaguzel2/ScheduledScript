"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "./ui/card";
import Logout from "./logout";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import SidebarElements from "./sidebar-elements";
import Link from "next/link";

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  className?: string;
}

export default function Sidebar({
  collapsed,
  onCollapsedChange,
  className,
}: SidebarProps) {
  return (
    <div className={`h-full ${collapsed ? "w-24" : "w-64"}`}>
      <Card
        className={`h-full rounded-none shadow-2xl shadow-popover-foreground text-secondary grid grid-rows-10 bg-gradient-to-br from-primary to-accent border-none ${
          className || ""
        }`}
      >
        <CardHeader
          className={`row-span-2 grid ${
            collapsed
              ? "justify-center"
              : "grid-cols-10 gap-3 items-baseline justify-center text-center"
          }`}
        >
          {!collapsed ? (
            <CardTitle className="text-xl col-span-8 text-secondary-foreground">
              <Link href="/panel">X-Ops Tools</Link>
            </CardTitle>
          ) : (
            <CardTitle className="text-xl text-center justify-center text-secondary-foreground">
              <Link href="/panel">X</Link>
            </CardTitle>
          )}
          <Button
            variant="ghost"
            className="rounded-full h-8 w-8 mx-auto text-secondary-foreground hover:text-secondary-foreground/80 hover:bg-secondary/10"
            onClick={() => onCollapsedChange(!collapsed)}
          >
            <ArrowLeft
              className={`transition-transform ${
                collapsed ? "rotate-180" : "rotate-0"
              }`}
            />
          </Button>
        </CardHeader>
        <CardContent className="row-span-6">
          <CardDescription>
            <SidebarElements isCollapsed={collapsed} />
          </CardDescription>
        </CardContent>
        <CardFooter className="row-span-4">
          <Logout isCollapsed={collapsed} />
        </CardFooter>
      </Card>
    </div>
  );
}
