// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );

  // Clear all auth cookies
  response.cookies.delete("token");
  response.cookies.delete("userRole");
  response.cookies.delete("userId");

  return response;
}