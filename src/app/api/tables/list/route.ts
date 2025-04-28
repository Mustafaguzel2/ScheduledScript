import { NextResponse } from "next/server";
import { getTableList } from "../../utils/db";

export async function GET() {
  try {
    const tables = await getTableList();
    return NextResponse.json({ tables });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: "Failed to fetch tables", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 