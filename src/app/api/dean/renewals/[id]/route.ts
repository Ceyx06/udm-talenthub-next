import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> }; // ← Changed to Promise

// PATCH /api/dean/renewals/:id
// body: { deanRecommendation: "RENEW" | "NOT_RENEW", deanRemarks?: string }
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params; // ← Added await
    const body = await req.json();
    const rec = body?.deanRecommendation;

    if (rec !== "RENEW" && rec !== "NOT_RENEW") {
      return NextResponse.json(
        { error: "deanRecommendation must be 'RENEW' or 'NOT_RENEW'." },
        { status: 400 }
      );
    }

    // Update the renewal record
    const updated = await prisma.renewal.update({
      where: { id },
      data: {
        deanRecommendation: rec,
        deanRemarks: body.deanRemarks || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating renewal:", error);
    return NextResponse.json(
      { error: "Failed to update renewal" },
      { status: 500 }
    );
  }
}