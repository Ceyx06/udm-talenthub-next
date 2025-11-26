import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET /api/dean/renewals?search=&skip=0&take=20
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const skip = Number(searchParams.get("skip") ?? 0);
  const take = Math.min(Number(searchParams.get("take") ?? 20), 100);

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
        orderBy: { endDate: "asc" },
        skip,
        take,
        include: {
          evaluation: {
            include: {
              application: {
                include: {
                  vacancy: true, // optional but consistent with your reference
                },
              },
            },
          },
        },
      }),
      prisma.contract.count({ where }),
    ]);

    const items = contracts.map((c) => ({
      id: c.id,
      facultyName: c.facultyName,
      position: c.jobTitle, // adjust if your field is named 'position'
      type: c.evaluation?.application?.employmentType ?? null, // <── FIXED TYPE
      contractEndDate: c.endDate ? c.endDate.toISOString() : null,
      status: c.status,
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
