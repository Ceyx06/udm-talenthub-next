// src/app/api/hr/vacancy-request/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/hr/vacancy-request  -> list pending requests for HR
export async function GET() {
  try {
    const pending = await prisma.vacancyRequest.findMany({
      where: { status: "Pending" },
      orderBy: { submittedAt: "asc" },
    });

    return NextResponse.json(pending);
  } catch (error) {
    console.error("GET /api/hr/vacancy-request error:", error);
    return NextResponse.json(
      { error: "Failed to load vacancy requests" },
      { status: 500 }
    );
  }
}
