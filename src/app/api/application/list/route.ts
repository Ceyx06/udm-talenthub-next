// src/app/api/applications/list/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const stage = searchParams.get("stage");

    console.log('📋 Fetching applications with params:', { role, stage });

    // Build the where clause based on role
    let whereClause: any = {};

    if (role === "DEAN") {
      // Dean sees applications that are APPLIED (for review) or ENDORSED (already reviewed)
      if (stage && stage !== "ALL") {
        whereClause.stage = stage;
      } else {
        // Show APPLIED and ENDORSED by default
        whereClause.stage = {
          in: ["APPLIED", "ENDORSED"]
        };
      }
    } else if (role === "HR") {
      // HR sees endorsed and later stages
      whereClause.stage = {
        in: ["ENDORSED", "INTERVIEW_SCHEDULED", "EVALUATED", "FOR_HIRING", "HIRED"]
      };
    }

    console.log('🔍 Where clause:', JSON.stringify(whereClause));

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        vacancy: {
          select: {
            id: true,
            title: true,
            college: true,
            status: true,
          },
        },
        interviews: {
          select: {
            id: true,
            interviewDate: true,
            teachingDemoDate: true,
            status: true,
          },
        },
      },
      orderBy: { 
        appliedDate: "desc" 
      },
    });

    console.log('✅ Found applications:', applications.length);

    return NextResponse.json({
      success: true,
      data: applications,
      count: applications.length,
    });
  } catch (error) {
    console.error("❌ Error fetching applications:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch applications" 
      },
      { status: 500 }
    );
  }
}