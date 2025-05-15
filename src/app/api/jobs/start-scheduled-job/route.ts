import { NextRequest, NextResponse } from "next/server";
import { startScheduledJob, executeJob } from "./cron";
import { 
  getJobFromFile, 
  getAllJobsFromFile, 
  deleteJobFromFile, 
  initializeStoredJobs,
  cleanupCanceledJobs
} from "../../../../lib/fileJobStore";

// Clean up canceled jobs first, then initialize stored jobs
cleanupCanceledJobs();

// Initialize stored jobs when the API route module loads
// This ensures jobs persist across server restarts
initializeStoredJobs(executeJob);

export async function POST(request: NextRequest) {
  const { cronExpression, scriptName } = await request.json();
  
  if (!cronExpression) {
    return NextResponse.json(
      { message: "Cron expression is required" },
      { status: 400 }
    );
  }
  
  try {
    const job = await startScheduledJob(cronExpression, scriptName);
    return NextResponse.json(
      { 
        message: "Job scheduled successfully",
        job
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error scheduling job:", error);
    return NextResponse.json({ message: "Job scheduling failed", error }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (id) {
    // Get a specific job
    const job = getJobFromFile(id);
    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }
    
    return NextResponse.json({ job });
  } else {
    // Get all jobs
    const jobs = getAllJobsFromFile();
    return NextResponse.json({ jobs });
  }
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ message: "Job ID is required" }, { status: 400 });
  }
  
  const success = deleteJobFromFile(id);
  
  if (!success) {
    return NextResponse.json({ message: "Job not found or could not be deleted" }, { status: 404 });
  }
  
  return NextResponse.json({ message: "Job deleted successfully" });
}
