import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET /api/dean/renewals?search=&skip=0&take=20
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const skip = Number(searchParams.get("skip") ?? 0);
  const take = Math.min(Number(searchParams.get("take") ?? 20), 100);

  const where = search
    ? {
        OR: [
          { facultyName: { contains: search, mode: "insensitive" } },
          { position: { contains: search, mode: "insensitive" } },
          { college: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  try {
    const [items, total] = await Promise.all([
      prisma.renewal.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.renewal.count({ where }),
    ]);
    return NextResponse.json({ items, total, skip, take });
  } catch (e: any) {
    // Before migration: table/enums may not exist → return empty list instead of 500
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      (e.code === "P2021" || e.code === "P2022" || e.code === "P2010")
    ) {
      return NextResponse.json({ items: [], total: 0, skip, take });
    }
    console.error("GET /api/dean/renewals error:", e);
    return NextResponse.json({ error: "Failed to fetch renewals" }, { status: 500 });
  }
}
