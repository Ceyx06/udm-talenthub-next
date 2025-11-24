// src/app/api/dean/renewals/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET /api/dean/renewals?search=&skip=0&take=20
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const skip = Number(searchParams.get("skip") ?? 0);
  const take = Math.min(Number(searchParams.get("take") ?? 20), 100);

  // Adjust field names here to match your Contract model
  const where: Prisma.ContractWhereInput = search
    ? {
        OR: [
          { facultyName: { contains: search, mode: "insensitive" } },
          { jobTitle: { contains: search, mode: "insensitive" } },
          { college: { contains: search, mode: "insensitive" } },
          { contractNo: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  try {
    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        orderBy: { endDate: "asc" }, // contracts ending soon first
        skip,
        take,
      }),
      prisma.contract.count({ where }),
    ]);

    const items = contracts.map((c) => ({
      id: c.id,
      facultyName: c.facultyName,
      position: c.jobTitle, // or c.position if that's your field
      type: (c as any).type ?? null, // if you have a 'type' field; otherwise can be removed
      contractEndDate: c.endDate ? c.endDate.toISOString() : null,
      status: c.status, // value from Contract.status
    }));

    return NextResponse.json({ items, total, skip, take });
  } catch (e: any) {
    console.error("GET /api/dean/renewals error:", e);
    return NextResponse.json(
      { error: "Failed to fetch dean renewals" },
      { status: 500 }
    );
  }
}
