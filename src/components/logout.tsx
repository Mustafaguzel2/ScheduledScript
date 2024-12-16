"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { ModeToggle } from "./theme";
type LogoutProps = {
  className?: string;
  isCollapsed?: boolean;
};

export default function Logout({ className, isCollapsed }: LogoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const usernameCookie = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("username="));

      if (usernameCookie) {
        const usernameValue = decodeURIComponent(usernameCookie.split("=")[1]);
        console.log("Username from cookie:", usernameValue); // Debugging
        setUsername(usernameValue);
      } else {
        console.log("Username cookie not found");
      }
    }
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account.",
        });
        router.push("/");
      } else {
        throw new Error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      className={`flex flex-col gap-3 items-start justify-center text-center ${
        className || ""
      }`}
    >
      {!isCollapsed && <p className="text-lg font-bold">Hello {username}</p>}
      <ModeToggle />
      <Button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`flex items-center justify-center text-secondary bg-gradient-to-tl from-indigo-500 to-purple-600 shadow-xl ${
          isCollapsed ? "w-10 h-10 p-0" : "row-span-1"
        }`}
      >
        <LogOut className={`h-6 w-6 ${isCollapsed ? "" : "mr-2"}`} />
        {!isCollapsed && (isLoggingOut ? "Logging out..." : "Logout")}
      </Button>
    </div>
  );
}
