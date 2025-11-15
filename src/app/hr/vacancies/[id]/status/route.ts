import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const { status } = await req.json();
    if (!["OPEN", "CLOSED", "DRAFT"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    
    const updated = await prisma.vacancy.update({ 
      where: { id }, 
      data: { status } 
    });
    
    return NextResponse.json({ data: updated });
  } catch (e: any) {
    console.error("PATCH /hr/vacancies/[id]/status error:", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}