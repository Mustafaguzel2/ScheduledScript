import { Loader2 } from "lucide-react";
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="mx-auto my-3 animate-spin h-12 w-12" />
    </div>
  );
}
