import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const JOBS_FILE = path.resolve(process.cwd(), "data/jobs_parameter.json");
const PYTHON_PATH = path.resolve(process.cwd(), "src/.venv/bin/python3");

type JobType = {
  status: string;
  output?: string;
  error?: string;
  startedAt?: number;
  finishedAt?: number;
};

function readJobs(): Record<string, JobType> {
  try {
    return JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeJobs(jobs: Record<string, JobType>) {
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs));
}

export async function POST(request: NextRequest) {
  const { selectedNodes } = await request.json();
  const jobId = "parameter-job"; // Tek bir job için sabit id
  const jobs = readJobs();
  jobs[jobId] = { status: "working", startedAt: Date.now() };
  writeJobs(jobs);

  const python = spawn(PYTHON_PATH, [
    "src/scripts/parameter_job.py",
    JSON.stringify(selectedNodes),
  ]);

  let output = "";
  let error = "";

  python.stdout.on("data", (data) => {
    output += data.toString();
  });

  python.stderr.on("data", (data) => {
    error += data.toString();
  });

  python.on("close", (code) => {
    const jobs = readJobs();
    if (code === 0) {
      jobs[jobId] = { status: "finished", output, finishedAt: Date.now() };
    } else {
      jobs[jobId] = { status: "error", error, finishedAt: Date.now() };
    }
    writeJobs(jobs);
  });

  return NextResponse.json({ message: "Job started", jobId }, { status: 200 });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  const jobs = readJobs();
  const jobId = "parameter-job";
  if (!jobs[jobId]) {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }
  return NextResponse.json(jobs[jobId], { status: 200 });
}