// src/app/api/dean/renewals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/dean/renewals/[id]
// body: { decision: "RENEW" | "NOT_RENEW" }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const body = await req.json();
    const decision = body?.decision as "RENEW" | "NOT_RENEW";

    if (decision !== "RENEW" && decision !== "NOT_RENEW") {
      return NextResponse.json(
        { error: "decision must be 'RENEW' or 'NOT_RENEW'." },
        { status: 400 }
      );
    }

    // Map decision -> Contract.status
    // 🔧 Adjust these strings to match your actual ContractStatus enum values
    let newStatus: string;
    if (decision === "RENEW") {
      newStatus = "APPROVED"; // or "RENEWED"
    } else {
      newStatus = "NOT_RENEW"; // or "REJECTED"
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: { status: newStatus },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/dean/renewals/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update contract status" },
      { status: 500 }
    );
  }
}
