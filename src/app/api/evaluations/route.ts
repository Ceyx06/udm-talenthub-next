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
      evaluatedBy
    } = body;

    // Create evaluation
    const evaluation = await prisma.evaluation.create({
      data: {
        applicationId,
        educationalScore,
        experienceScore,
        professionalDevScore,
        technologicalScore,
        totalScore,
        rank,
        ratePerHour,
        detailedScores,
        evaluatedBy
      }
    });

    // Check if qualified (e.g., totalScore >= passing score)
    const PASSING_SCORE = 175; // Adjust as needed (70% of 250)
    
    if (totalScore >= PASSING_SCORE) {
      // Update application to HIRED
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          stage: 'HIRED',
          status: 'HIRED',
          statusUpdatedAt: new Date(),
          employeeId: `EMP-${Date.now()}` // Generate employee ID
        }
      });

      // Create contract (if you have Contract model)
      // await prisma.contract.create({ ... });
    }

    return NextResponse.json({
      success: true,
      data: evaluation,
      hired: totalScore >= PASSING_SCORE
    });
  } catch (error: any) {
    console.error('Error saving evaluation:', error);
    return NextResponse.json({
      error: 'Failed to save evaluation',
      message: error.message
    }, { status: 500 });
  }
}