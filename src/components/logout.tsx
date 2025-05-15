"use client";

import { Button } from "./ui/button";
import { useToast } from "../hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { ModeToggle } from "./theme";

type LogoutProps = {
  isCollapsed?: boolean;
};

export default function Logout({ isCollapsed }: LogoutProps) {
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
    <div className="flex flex-col space-y-2">
      {/* Theme controller */}
      <div className="px-1.5">
        <ModeToggle />
      </div>
      {/* Logout */}
      <Button
        variant="ghost"
        className={`
          flex flex-row
          text-secondary-foreground hover:text-secondary-foreground/80 hover:bg-secondary/10 
          gap-4
          py-1.5
          justify-start
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
