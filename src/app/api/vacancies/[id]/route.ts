// src/app/api/vacancies/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET single vacancy by ID (for public job viewing)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    console.log('🔍 Fetching vacancy with ID:', params.id);

    const vacancy = await prisma.vacancy.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });

    if (!vacancy) {
      console.log('❌ Vacancy not found:', params.id);
      return NextResponse.json(
        { error: "Vacancy not found" },
        { status: 404 }
      );
    }

    console.log('✅ Found vacancy:', vacancy.title);

    // Return vacancy directly (NOT wrapped in {data: ...})
    return NextResponse.json(vacancy);

  } catch (e: any) {
    console.error("GET /api/vacancies/:id error:", e);
    return NextResponse.json(
      { error: "Failed to fetch vacancy" },
      { status: 500 }
    );
  }
}

// DELETE vacancy
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.vacancy.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Vacancy not found" }, { status: 404 });
    }
    console.error("DELETE /api/vacancies/:id", e);
    return NextResponse.json({ error: "Failed to delete vacancy" }, { status: 500 });
  }
}

// PATCH/UPDATE vacancy
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const vacancy = await prisma.vacancy.update({
      where: { id: params.id },
      data: body
    });

    return NextResponse.json(vacancy); // Return directly, not wrapped
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Vacancy not found" }, { status: 404 });
    }
    console.error("PATCH /api/vacancies/:id", e);
    return NextResponse.json({ error: "Failed to update vacancy" }, { status: 500 });
  }
}