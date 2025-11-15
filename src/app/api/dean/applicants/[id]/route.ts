import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await req.json();
    const { status, stage, message } = body;

    const application = await prisma.application.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(stage ? { stage } : {}),
        ...(message ? { message } : {}),
      },
    });

    return NextResponse.json({ data: application });
  } catch (e: any) {
    console.error("PATCH dean applicant:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to update" },
      { status: 500 }
    );
  }
}