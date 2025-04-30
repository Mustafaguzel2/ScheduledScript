"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { ModeToggle } from "./theme";

type LogoutProps = {
  className?: string;
  isCollapsed?: boolean;
};

export default function Logout({ className, isCollapsed }: LogoutProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      toast({
        title: "Success",
        description: "You have been logged out successfully.",
      });

      router.push("/");
    } catch {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`flex flex-col gap-4 w-full ${className || ""} ${
        isCollapsed ? "items-center" : ""
      }`}
    >
      <div className="flex justify-center">
        <ModeToggle />
      </div>
      <Button
        variant="ghost"
        className={`flex items-center text-secondary-foreground hover:text-secondary-foreground/80 hover:bg-secondary/10 ${
          isCollapsed ? "justify-center p-2 w-10 h-10" : "gap-3"
        }`}
        onClick={handleLogout}
        disabled={isLoading}
      >
        <LogOut className={`${isCollapsed ? "w-6 h-6" : "w-5 h-5"}`} />
        {!isCollapsed && <span>Logout</span>}
      </Button>
    </div>
  );
}
