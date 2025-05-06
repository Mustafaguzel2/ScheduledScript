import { NextRequest, NextResponse } from "next/server";
import { startScheduledJob } from "./cron";
import { getJob, getAllJobs, deleteJob } from "@/lib/jobStore";

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
        job: {
          id: job.id,
          cronExpression: job.cronExpression,
          status: job.status,
          created: job.created,
          nextRun: job.nextRun,
          hasLogs: job.hasLogs
        }
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
    const job = getJob(id);
    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      job: {
        id: job.id,
        cronExpression: job.cronExpression,
        status: job.status,
        created: job.created,
        lastRun: job.lastRun,
        nextRun: job.nextRun,
        hasLogs: job.hasLogs
      }
    });
  } else {
    // Get all jobs
    const jobs = getAllJobs();
    return NextResponse.json({
      jobs: jobs.map(job => ({
        id: job.id,
        cronExpression: job.cronExpression,
        status: job.status,
        created: job.created,
        lastRun: job.lastRun,
        nextRun: job.nextRun,
        hasLogs: job.hasLogs
      }))
    });
  }
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ message: "Job ID is required" }, { status: 400 });
  }
  
  const success = deleteJob(id);
  
  if (!success) {
    return NextResponse.json({ message: "Job not found or could not be deleted" }, { status: 404 });
  }
  
  return NextResponse.json({ message: "Job deleted successfully" });
}
