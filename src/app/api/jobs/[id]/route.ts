import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public: single vacancy (open & not expired)
export async function GET(
  _req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const cutoff = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const v = await prisma.vacancy.findFirst({
      where: { 
        id, 
        status: "OPEN", 
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
    
    if (!v) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    
    return NextResponse.json({ data: v });
  } catch (e: any) {
    console.error('Error fetching vacancy:', e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}