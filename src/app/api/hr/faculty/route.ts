// src/app/api/hr/faculty/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/hr/faculty?search=&skip=0&take=20
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const skip = Number(searchParams.get("skip") ?? 0);
    const take = Math.min(Number(searchParams.get("take") ?? 20), 100);

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { position: { contains: search, mode: "insensitive" } },
            { type: { contains: search, mode: "insensitive" } },
            { contract: { contains: search, mode: "insensitive" } },
            { recommendation: { contains: search, mode: "insensitive" } },
            { actions: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.faculty.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take,
      }),
      prisma.faculty.count({ where }),
    ]);

    return NextResponse.json({ items, total, skip, take });
  } catch (err) {
    console.error("GET /api/hr/faculty error:", err);
    return NextResponse.json({ error: "Failed to fetch faculty" }, { status: 500 });
  }
}

// POST /api/hr/faculty
// body: { name, position, type, contract, recommendation, actions }
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const required = ["name", "position", "type", "contract", "recommendation", "actions"] as const;
    for (const k of required) {
      if (!body?.[k] || typeof body[k] !== "string") {
        return NextResponse.json({ error: `Field '${k}' is required and must be a string.` }, { status: 400 });
      }
    }

    const created = await prisma.faculty.create({
      data: {
        name: body.name,
        position: body.position,
        type: body.type,
        contract: body.contract,
        recommendation: body.recommendation,
        actions: body.actions,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/hr/faculty error:", err);
    return NextResponse.json({ error: "Failed to create faculty" }, { status: 500 });
  }
}
