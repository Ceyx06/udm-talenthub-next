import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/hr/vacancies  — list all for HR (with applications count)
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

// POST /api/hr/vacancies — create
export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const title        = body.title?.trim();
    const college      = (body.college ?? body.department)?.trim(); // accept both
    const status       = (body.status ?? "OPEN").toString().trim();
    const description  = (body.description ?? "").toString().trim();
    const requirements = (body.requirements ?? "").toString().trim();
    const postedDate   = body.postedDate ? new Date(body.postedDate) : new Date();

    if (!title || !college || !requirements) {
      return NextResponse.json(
        { error: "Missing required fields: title, college, requirements" },
        { status: 400 }
      );
    }

    const created = await prisma.vacancy.create({
      data: { title, college, status, description, requirements, postedDate },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/hr/vacancies:", e);
    return NextResponse.json({ error: e?.message || "Failed to create vacancy" }, { status: 500 });
  }
}
