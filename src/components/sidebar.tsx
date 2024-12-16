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
import { useState } from "react";

type SidebarProps = {
  className?: string;
};

export default function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`flex min-h-screen ${isCollapsed ? "w-24" : "w-56"} `}>
      <Card
        className={`rounded-none shadow-2xl shadow-popover-foreground text-secondary grid grid-rows-10 bg-gradient-to-br from-indigo-400 to-purple-600  border-none${
          className || ""
        }`}
      >
        <CardHeader
          className={`row-span-2 grid ${
            isCollapsed
              ? "justify-center"
              : "grid-cols-10 gap-3 items-baseline justify-center text-center"
          }`}
        >
          {!isCollapsed ? (
            <CardTitle className="text-xl col-span-8">
              <Link href="/panel">X-Ops Tools</Link>
            </CardTitle>
          ) : (
            <CardTitle className="text-xl text-center justify-center">
              <Link href="/panel">X</Link>
            </CardTitle>
          )}
          <Button
            variant="ghost"
            className={`${"rounded-full h-8 w-8 mx-auto"}`}
            onClick={toggleSidebar}
          >
            <ArrowLeft
              className={`transition-transform ${
                isCollapsed ? "rotate-180" : "rotate-0"
              }`}
            />
          </Button>
        </CardHeader>
        <CardContent className={`row-span-6`}>
          <CardDescription>
            <SidebarElements isCollapsed={isCollapsed} />
          </CardDescription>
        </CardContent>
        <CardFooter className={`row-span-4`}>
          <Logout isCollapsed={isCollapsed} />
        </CardFooter>
      </Card>
    </div>
  );
}
