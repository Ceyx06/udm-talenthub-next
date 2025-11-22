import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


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
          // keep existing employeeId if already set
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
