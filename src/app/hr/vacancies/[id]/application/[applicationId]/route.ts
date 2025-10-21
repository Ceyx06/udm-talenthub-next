import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/hr/applications/:id  -> update application status
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json();
    if (!status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }
    const application = await prisma.application.update({
      where: { id: params.id },
      data: { status },
    });
    return NextResponse.json({ data: application });
  } catch (e: any) {
    console.error("PUT application status:", e);
    return NextResponse.json({ error: e?.message || "Failed to update application" }, { status: 500 });
  }
}
