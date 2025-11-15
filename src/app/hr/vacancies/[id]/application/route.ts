import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /hr/vacancies/[id]/application -> list apps for a vacancy
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const applications = await prisma.application.findMany({
      where: { vacancyId: id },
      orderBy: { appliedDate: "desc" },
    });
    return NextResponse.json({ data: applications });
  } catch (e: any) {
    console.error("GET applications by vacancy:", e);
    return NextResponse.json({ error: e?.message || "Failed to fetch applications" }, { status: 500 });
  }
}