// src/app/api/hr/vacancies/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await prisma.vacancy.findMany({
      include: { _count: { select: { applications: true } } },
      orderBy: { postedDate: "desc" },
    });
    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/hr/vacancies:", e);
    return NextResponse.json({ error: "Failed to fetch vacancies" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await prisma.vacancy.create({
      data: {
        title: body.title?.trim(),
        college: (body.college ?? body.department)?.trim(),
        status: (body.status ?? "OPEN").toString().trim(),
        description: (body.description ?? "").toString().trim(),
        requirements: (body.requirements ?? "").toString().trim(),
        postedDate: body.postedDate ? new Date(body.postedDate) : new Date(),
      },
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/hr/vacancies:", e);
    return NextResponse.json({ error: e?.message || "Failed to create vacancy" }, { status: 500 });
  }
}
