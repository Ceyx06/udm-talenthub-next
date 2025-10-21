import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DeanRecommendation } from "@prisma/client";

type Params = { params: { id: string } };

// PATCH /api/dean/renewals/:id
// body: { deanRecommendation: "RENEW" | "NOT_RENEW", deanRemarks?: string }
export async function PATCH(req: Request, { params }: Params) {
  try {
    const id = params.id;
    const body = await req.json();
    const rec = body?.deanRecommendation;

    if (rec !== "RENEW" && rec !== "NOT_RENEW") {
      return NextResponse.json(
        { error: "deanRecommendation must be 'RENEW' or 'NOT_RENEW'." },
        { status: 400 }
      );
    }

    const updated = await prisma.renewal.update({
      where: { id },
      data: {
        deanRecommendation: rec as DeanRecommendation,
        deanRemarks: body?.deanRemarks ?? null,
        deanUserId: "TODO-current-dean-id", // wire to auth when ready
        deanActedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("PATCH /api/dean/renewals/[id]", e);
    return NextResponse.json({ error: "Failed to update renewal" }, { status: 500 });
  }
}
