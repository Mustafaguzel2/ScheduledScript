import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center space-y-6 p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-6xl font-bold text-gray-800">404</h1>
        <h2 className="text-3xl font-semibold text-gray-700">Page Not Found</h2>
        <p className="text-xl text-gray-600">Oops! The page you are looking for does not exist.</p>
        <div className="pt-4">
          <Button asChild>
            <Link href="/panel">
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

