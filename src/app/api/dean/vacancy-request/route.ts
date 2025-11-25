// src/app/api/dean/vacancy-request/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET  /api/dean/vacancy-request  -> list dean's vacancy requests
export async function GET() {
  try {
    const requests = await prisma.vacancyRequest.findMany({
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("GET /api/dean/vacancy-request error:", error);
    return NextResponse.json(
      { error: "Failed to load vacancy requests" },
      { status: 500 }
    );
  }
}

// POST /api/dean/vacancy-request  -> create a new vacancy request
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      jobTitle,
      college,
      numberOfSlots,
      targetStartDate,
      minimumQualifications,
      justification,
    } = body;

    // Basic validation
    if (!jobTitle || !college || !numberOfSlots || !targetStartDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const slots = Number(numberOfSlots);
    if (Number.isNaN(slots) || slots <= 0) {
      return NextResponse.json(
        { error: "numberOfSlots must be a positive number" },
        { status: 400 }
      );
    }

    // targetStartDate comes from <input type="date"> as "YYYY-MM-DD"
    const parsedDate = new Date(targetStartDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid targetStartDate" },
        { status: 400 }
      );
    }

    const created = await prisma.vacancyRequest.create({
      data: {
        jobTitle,
        college,
        numberOfSlots: slots,
        targetStartDate: parsedDate,
        minimumQualifications: minimumQualifications ?? "",
        justification: justification ?? "",
        status: "Pending",
        submittedAt: new Date(),
        // submittedBy: userId (when you add auth)
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/dean/vacancy-request error:", error);
    return NextResponse.json(
      { error: "Failed to submit vacancy request" },
      { status: 500 }
    );
  }
}
