// src/app/api/auth/route.ts   (or /auth/login/route.ts if that’s your folder)
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ✅ use the singleton

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Look up user
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // return whatever token/session you use here
    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
