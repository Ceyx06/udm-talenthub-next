import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const college = searchParams.get("college") || undefined;

    // Dean sees all applications that have been endorsed (stage >= Endorsed)
    const applications = await prisma.application.findMany({
      where: {
        stage: { 
          in: [
            "Endorsed", 
            "Interview Scheduled", 
            "Evaluated", 
            "For Hiring", 
            "Hired",
            "Rejected"
          ] 
        },
        ...(college ? { department: college } : {}),
      },
      include: {
        vacancy: {
          select: {
            title: true,
            college: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: applications,
      count: applications.length,
    });
  } catch (error) {
    console.error("Error fetching Dean applicants:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}