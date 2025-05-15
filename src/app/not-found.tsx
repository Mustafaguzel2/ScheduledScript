import Link from "next/link";
import { Button } from "../components/ui/button";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
      <div className="max-w-md w-full px-8 py-12 rounded-xl bg-card text-card-foreground shadow-lg border border-border/50">
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="relative">
              <div className="text-9xl font-extrabold text-primary/10">404</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-24 h-24 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20h.01"
                  />
                </svg>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold">Page Not Found</h2>

          <p className="text-muted-foreground">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>

          <div className="pt-6">
            <Button asChild className="transition-all hover:scale-105">
              <Link href="/panel">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
