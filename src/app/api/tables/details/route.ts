import { NextResponse } from "next/server";
import { getTableDetails } from "../../utils/db";

export async function GET() {
  try {
    const details = await getTableDetails();
    return NextResponse.json(details);
  } catch {
    return NextResponse.json({ error: "Failed to fetch table details" }, { status: 500 });
  }
} 