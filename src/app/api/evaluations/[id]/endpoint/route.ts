import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            vacancy: true,
          },
        },
      },
    });

    if (!evaluation) {
      return NextResponse.json(
        { message: "Evaluation not found" },
        { status: 404 }
      );
    }

    // Return raw data so we can see what's actually stored
    return NextResponse.json({
      id: evaluation.id,
      applicationId: evaluation.applicationId,
      educationalScore: evaluation.educationalScore,
      experienceScore: evaluation.experienceScore,
      professionalDevScore: evaluation.professionalDevScore,
      technologicalScore: evaluation.technologicalScore,
      totalScore: evaluation.totalScore,
      detailedScores: evaluation.detailedScores,
      rawDetailedScores: JSON.stringify(evaluation.detailedScores, null, 2),
    });
  } catch (error: any) {
    console.error("Error fetching evaluation:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch evaluation",
        error: error?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}