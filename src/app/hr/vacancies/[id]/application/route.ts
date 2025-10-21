import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/hr/vacancies/:id/applications  -> list apps for a vacancy
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const applications = await prisma.application.findMany({
      where: { vacancyId: params.id },
      orderBy: { appliedDate: "desc" },
    });
    return NextResponse.json({ data: applications });
  } catch (e: any) {
    console.error("GET applications by vacancy:", e);
    return NextResponse.json({ error: e?.message || "Failed to fetch applications" }, { status: 500 });
  }
}
