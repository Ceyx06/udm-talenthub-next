import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ADD THIS GET METHOD
export async function GET(request: Request) {
  try {
    const evaluations = await prisma.evaluation.findMany({
      include: {
        application: {
          include: {
            vacancy: true,
          },
        },
      },
      orderBy: {
        evaluatedAt: 'desc',
      },
    });

    return NextResponse.json(evaluations);
  } catch (error: any) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluations', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      applicationId,
      educationalScore,
      experienceScore,
      professionalDevScore,
      technologicalScore,
      totalScore,
      rank,
      ratePerHour,
      detailedScores,
      evaluatedBy,
      remarks,
    } = body;

    // Simple guard
    if (!applicationId) {
      return NextResponse.json(
        { error: 'applicationId is required' },
        { status: 400 },
      );
    }

    // If an evaluation already exists for this application, update it;
    // otherwise create a new one.
    const evaluation = await prisma.evaluation.upsert({
      where: { applicationId },
      create: {
        applicationId,
        educationalScore,
        experienceScore,
        professionalDevScore,
        technologicalScore,
        totalScore,
        rank,
        ratePerHour,
        detailedScores,
        evaluatedBy,
        remarks,
        contractStatus: 'pending', // Add default contract status
      },
      update: {
        educationalScore,
        experienceScore,
        professionalDevScore,
        technologicalScore,
        totalScore,
        rank,
        ratePerHour,
        detailedScores,
        evaluatedBy,
        remarks,
      },
    });

    const PASSING_SCORE = 175;

    if (totalScore >= PASSING_SCORE) {
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          stage: 'HIRED',
          status: 'HIRED',
          statusUpdatedAt: new Date(),
          employeeId: `EMP-${Date.now()}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: evaluation,
      hired: totalScore >= PASSING_SCORE,
    });
  } catch (error: any) {
    console.error('Error saving evaluation:', error);
    return NextResponse.json(
      {
        error: 'Failed to save evaluation',
        message: error?.message ?? 'Unknown error',
      },
      { status: 500 },
    );
  }
}