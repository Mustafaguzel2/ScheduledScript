import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Clear the session cookie
  (await cookies()).set({
    name: 'session',
    value: '',
    expires: new Date(0),
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
  });

  // You might want to perform additional cleanup here, such as:
  // - Invalidating the session in your database or cache
  // - Logging the logout event

  return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
}

