// src/app/api/hr/vacancy-request/[id]/decision/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

// POST /api/hr/vacancy-request/:id/decision
export async function POST(req: Request, { params }: Params) {
  const { id } = params;

  try {
    const body = await req.json();
    const {
      action,
      reviewNotes,
    }: { action: "approve" | "decline"; reviewNotes?: string } = body;

    const request = await prisma.vacancyRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (action === "approve") {
      // 1) Create Vacancy from this request
      const vacancy = await prisma.vacancy.create({
        data: {
          title: request.jobTitle,
          college: request.college,
          status: "OPEN",
          requirements: request.minimumQualifications,
          description: request.justification,
          // postedDate, createdAt, updatedAt have defaults
        },
      });

      // 2) Mark request as Approved
      await prisma.vacancyRequest.update({
        where: { id },
        data: {
          status: "Approved",
          reviewedAt: new Date(),
          reviewedBy: "HR_USER", // replace with real HR user id when you add auth
          reviewNotes,
          // if you later add a vacancyId field, store vacancy.id here
        },
      });
    } else if (action === "decline") {
      await prisma.vacancyRequest.update({
        where: { id },
        data: {
          status: "Declined",
          reviewedAt: new Date(),
          reviewedBy: "HR_USER",
          reviewNotes,
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/hr/vacancy-request/[id]/decision error:", error);
    return NextResponse.json(
      { error: "Failed to update vacancy request" },
      { status: 500 }
    );
  }
}
