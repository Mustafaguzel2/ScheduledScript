import { scheduleJob } from "node-schedule";
import { spawn } from "child_process";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { storeJob, updateJobStatus, ScheduledJob } from "@/lib/jobStore";
import { writeLog } from "@/lib/logger";

export async function startScheduledJob(cronExpression: string, scriptName: string): Promise<ScheduledJob> {
  const jobId = uuidv4();
  const scriptPath = path.resolve(process.cwd(), `src/scripts/${scriptName}`);
  
  writeLog(jobId, 'info', `Job scheduled with cron expression: ${cronExpression} and script: ${scriptName}`);
  
  const job = scheduleJob(cronExpression, () => {
    console.log(`Job ${jobId} started`);
    writeLog(jobId, 'info', `Job started execution`);
    updateJobStatus(jobId, 'running');
    
    try {
      const pythonProcess = spawn("python3", [scriptPath]);

      pythonProcess.stdout.on("data", (data) => {
        const output = data.toString().trim();
        console.log(`Python script output: ${output}`);
        writeLog(jobId, 'info', `Script output: ${output}`);
      });

      pythonProcess.stderr.on("data", (data) => {
        const errorOutput = data.toString().trim();
        console.error(`Python script error: ${errorOutput}`);
        writeLog(jobId, 'error', `Script error: ${errorOutput}`);
        updateJobStatus(jobId, 'failed');
      });

      pythonProcess.on("close", (code) => {
        console.log(`Python script exited with code ${code}`);
        if (code === 0) {
          writeLog(jobId, 'success', `Script completed successfully with exit code ${code}`);
          updateJobStatus(jobId, 'completed');
        } else {
          writeLog(jobId, 'error', `Script failed with exit code ${code}`);
          updateJobStatus(jobId, 'failed');
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error starting job:", errorMessage);
      writeLog(jobId, 'error', `Error starting job: ${errorMessage}`);
      updateJobStatus(jobId, 'failed');
    }
  });
  
  // Store and return the job details
  return storeJob(jobId, cronExpression, job, scriptPath);
}
