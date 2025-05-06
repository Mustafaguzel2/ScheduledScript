import { NextRequest, NextResponse } from "next/server";
import { startScheduledJob } from "./cron";

export async function POST(request: NextRequest) {
  const { cronExpression } = await request.json();
  try {
    startScheduledJob(cronExpression);
    return NextResponse.json(
      { message: "Job scheduled successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error scheduling job:", error);
    return NextResponse.json({ message: "Job failed" }, { status: 500 });
  }
}
