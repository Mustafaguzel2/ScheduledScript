import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  (await cookies()).set({
    name: "session",
    value: "",
    expires: new Date(0),
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict",
  });
  return NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );
}
