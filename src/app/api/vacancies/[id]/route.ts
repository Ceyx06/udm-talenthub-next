import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API: Get single vacancy for application page
export async function GET(
  _req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const cutoff = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

    const vacancy = await prisma.vacancy.findFirst({
      where: {
        id,
        // Accept both "OPEN" and "Active" status
        status: { in: ["OPEN", "Active"] },
        postedDate: { gte: cutoff }
      },
      select: {
        id: true,
        title: true,
        college: true,
        status: true,
        requirements: true,
        description: true,
        postedDate: true
      },
    });

    if (!vacancy) {
      return NextResponse.json({ error: "Vacancy not found or expired" }, { status: 404 });
    }

    // Normalize status to "OPEN" for the frontend
    return NextResponse.json({
      ...vacancy,
      status: "OPEN"
    });
  } catch (e: any) {
    console.error('Error fetching vacancy:', e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}