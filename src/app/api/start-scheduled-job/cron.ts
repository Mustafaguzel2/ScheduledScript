import { scheduleJob } from "node-schedule";
import { spawn } from "child_process";
import path from "path";
import { NextResponse } from "next/server";
export async function startScheduledJob(cronExpression: string) {
  scheduleJob(cronExpression, () => {
    console.log("Job started");
    try {
      const scriptPath = path.resolve(process.cwd(), "src/scripts/example.py");

      const pythonProcess = spawn("python3", [scriptPath]);

      pythonProcess.stdout.on("data", (data) => {
        console.log(`Python script output: ${data}`);
        return NextResponse.json({
          message: "Job started",
          data: data,
          status: 200,
        });
      });

      pythonProcess.stderr.on("data", (data) => {
        console.error(`Python script error: ${data}`);
        return NextResponse.json({
          message: "Job failed",
          data: data,
          status: 500,
        });
      });

      pythonProcess.on("close", (code) => {
        console.log(`Python script exited with code ${code}`);
        return NextResponse.json({ message: "Job finished", status: 200 });
      });
    } catch (error) {
      console.error("Error starting job:", error);
    }
  });
}
