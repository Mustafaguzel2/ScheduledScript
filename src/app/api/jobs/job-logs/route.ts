import { NextRequest, NextResponse } from "next/server";
import { readLogs } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get('jobId');
  
  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }
  
  try {
    const logs = readLogs(jobId);
    return NextResponse.json({ logs });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error retrieving logs for job ${jobId}:`, errorMessage);
    return NextResponse.json(
      { error: `Failed to retrieve logs: ${errorMessage}` }, 
      { status: 500 }
    );
  }
} 