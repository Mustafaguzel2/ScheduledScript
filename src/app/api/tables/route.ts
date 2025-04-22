import { NextResponse } from "next/server";
import { getTableDetails } from "../utils/db";

export async function GET() {
  try {
    const tables = await getTableDetails();
    return NextResponse.json({ tables });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch table details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
