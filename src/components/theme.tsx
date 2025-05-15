"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="text-muted-foreground hover:text-primary transition-colors"
    >
      {isDark ? (
        <Sun className="w-8 h-8" />
      ) : (
        <Moon className="w-8 h-8" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}