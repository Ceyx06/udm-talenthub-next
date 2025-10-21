// src/app/api/hr/vacancies/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.vacancy.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return NextResponse.json({ error: "Vacancy not found" }, { status: 404 });
    console.error("DELETE /api/hr/vacancies/:id", e);
    return NextResponse.json({ error: "Failed to delete vacancy" }, { status: 500 });
  }
}
