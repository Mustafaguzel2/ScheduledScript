import { scheduleJob } from "node-schedule";
import { spawn } from "child_process";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { writeLog } from "@/lib/logger";
import { 
  storeJobToFile, 
  updateJobStatusInFile, 
  storeActiveJob,
  getJobFromFile,
  ScheduledJobData 
} from "@/lib/fileJobStore";

export async function startScheduledJob(cronExpression: string, scriptName: string): Promise<ScheduledJobData> {
  const jobId = uuidv4();
  const scriptPath = path.resolve(process.cwd(), `src/scripts/${scriptName}`);
  const pythonPath = path.resolve(process.cwd(), "src/.venv/bin/python3");
  
  writeLog(jobId, 'info', `Job scheduled with cron expression: ${cronExpression} and script: ${scriptName}`);
  
  const job = scheduleJob(cronExpression, () => {
    // Always get fresh job data to check if job has been canceled
    const currentJobData = getJobFromFile(jobId);
    
    // If job doesn't exist in file or is marked as canceled, don't execute
    if (!currentJobData || currentJobData.canceled) {
      console.log(`Skipping execution of job ${jobId} because it was deleted or canceled`);
      return;
    }
    
    console.log(`Job ${jobId} started`);
    writeLog(jobId, 'info', `Job started execution`);
    updateJobStatusInFile(jobId, 'running');
    
    try {
      const logFilePath = path.resolve(process.cwd(), `logs/job-${jobId}.log`);
      const pythonProcess = spawn(pythonPath, [
        scriptPath,
        "--job-id", jobId,
        "--log-file", logFilePath,
        "--debug"
      ]);

      pythonProcess.stdout.on("data", (data) => {
        const output = data.toString().trim();
        console.log(`Python script output: ${output}`);
        writeLog(jobId, 'info', `Script output: ${output}`);
      });

      pythonProcess.stderr.on("data", (data) => {
        const errorOutput = data.toString().trim();
        console.error(`Python script error: ${errorOutput}`);
        writeLog(jobId, 'error', `Script error: ${errorOutput}`);
        updateJobStatusInFile(jobId, 'failed');
      });

      pythonProcess.on("close", (code) => {
        console.log(`Python script exited with code ${code}`);
        if (code === 0) {
          writeLog(jobId, 'success', `Script completed successfully with exit code ${code}`);
          updateJobStatusInFile(jobId, 'completed');
        } else {
          writeLog(jobId, 'error', `Script failed with exit code ${code}`);
          updateJobStatusInFile(jobId, 'failed');
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error starting job:", errorMessage);
      writeLog(jobId, 'error', `Error starting job: ${errorMessage}`);
      updateJobStatusInFile(jobId, 'failed');
    }
  });
  
  // Store active job in memory
  storeActiveJob(jobId, job);
  
  // Get the next scheduled run
  const nextRun = job.nextInvocation();
  
  // Create job data
  const jobData: ScheduledJobData = {
    id: jobId,
    cronExpression,
    status: 'scheduled',
    created: new Date().toISOString(),
    scriptPath,
    scriptName,
    nextRun: nextRun ? nextRun.toISOString() : undefined,
    hasLogs: true,
    canceled: false // Explicitly mark as not canceled
  };
  
  // Store job data in file
  storeJobToFile(jobData);
  
  return jobData;
}

// Function to handle job execution (used for initializing stored jobs)
export function executeJob(jobId: string, scriptPath: string): void {
  const pythonPath = path.resolve(process.cwd(), "src/.venv/bin/python3");
  const logFilePath = path.resolve(process.cwd(), `logs/job-${jobId}.log`);
  // Always get fresh job data to check if job has been canceled
  const currentJobData = getJobFromFile(jobId);
  
  // If job doesn't exist in file or is marked as canceled, don't execute
  if (!currentJobData || currentJobData.canceled) {
    console.log(`Skipping execution of job ${jobId} because it was deleted or canceled`);
    return;
  }
  
  console.log(`Job ${jobId} started`);
  writeLog(jobId, 'info', `Job started execution`);
  updateJobStatusInFile(jobId, 'running');
  
  try {
    const pythonProcess = spawn(pythonPath, [
      scriptPath,
      "--job-id", jobId,
      "--log-file", logFilePath,
      "--debug"
    ]);

    pythonProcess.stdout.on("data", (data) => {
      const output = data.toString().trim();
      console.log(`Python script output: ${output}`);
      writeLog(jobId, 'info', `Script output: ${output}`);
    });

    pythonProcess.stderr.on("data", (data) => {
      const errorOutput = data.toString().trim();
      console.error(`Python script error: ${errorOutput}`);
      writeLog(jobId, 'error', `Script error: ${errorOutput}`);
      updateJobStatusInFile(jobId, 'failed');
    });

    pythonProcess.on("close", (code) => {
      console.log(`Python script exited with code ${code}`);
      if (code === 0) {
        writeLog(jobId, 'success', `Script completed successfully with exit code ${code}`);
        updateJobStatusInFile(jobId, 'completed');
      } else {
        writeLog(jobId, 'error', `Script failed with exit code ${code}`);
        updateJobStatusInFile(jobId, 'failed');
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error starting job:", errorMessage);
    writeLog(jobId, 'error', `Error starting job: ${errorMessage}`);
    updateJobStatusInFile(jobId, 'failed');
  }
}
