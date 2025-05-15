import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const LOG_FILE = path.resolve(process.cwd(), "bmc_discovery.log");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const logs = fs.readFileSync(LOG_FILE, "utf-8");
    return NextResponse.json({ logs });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
    return NextResponse.json({ logs: "" });
  }
} 