import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    if (!["OPEN","CLOSED","DRAFT"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const updated = await prisma.vacancy.update({ where: { id: params.id }, data: { status } });
    return NextResponse.json({ data: updated });
  } catch (e: any) {
    console.error("PATCH /api/hr/vacancies/[id]/status error:", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
