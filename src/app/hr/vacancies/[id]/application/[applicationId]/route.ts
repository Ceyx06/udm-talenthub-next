import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /hr/vacancies/[id]/application/[applicationId] -> update application status
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  const { id, applicationId } = await params;
  
  try {
    const { status } = await req.json();
    if (!status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }
    
    const application = await prisma.application.update({
      where: { 
        id: applicationId,
        vacancyId: id  // Ensure the application belongs to this vacancy
      },
      data: { status },
    });
    
    return NextResponse.json({ data: application });
  } catch (e: any) {
    console.error("PUT application status:", e);
    return NextResponse.json({ error: e?.message || "Failed to update application" }, { status: 500 });
  }
}