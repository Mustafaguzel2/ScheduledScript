"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Successfully logged in",
        });
        // Redirect or update UI state here
        router.push("/panel");
      } else {
        throw new Error(data.message || "Failed to login");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to login",
      });
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-bl from-primary to-accent">
      <Card className="w-full max-w-4xl overflow-hidden shadow-2xl shadow-black rounded-2xl border-none">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 bg-card p-8 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <h1 className="text-2xl font-bold text-center text-card-foreground mb-6">
                X-Ops <br /> Active Directory Login
              </h1>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Username
                  </label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    disabled={isLoading}
                    className="w-full border-input bg-background text-foreground shadow-sm focus:ring-ring focus:border-ring transition duration-150 ease-in-out"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      disabled={isLoading}
                      className="w-full border-input bg-background text-foreground shadow-sm focus:ring-ring focus:border-ring transition duration-150 ease-in-out pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition duration-150 ease-in-out"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </div>
          </div>
          <div className="hidden md:block w-1/2 bg-gradient-to-bl from-primary to-accent p-8">
            <div className="h-full flex items-center justify-center">
              <Image
                src="/favicon.ico"
                width={200}
                height={200}
                alt="Logo"
                className="rounded-2xl shadow-2xl p-6 w-3/5 bg-background/10"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
