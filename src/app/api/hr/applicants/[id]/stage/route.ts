// src/app/api/hr/applicants/[id]/stage/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { stage, interviewDate, evaluationScore, evaluationNotes, rejectionReason } = body;

    if (!stage) {
      return NextResponse.json(
        { error: 'Stage is required' },
        { status: 400 }
      );
    }

    // Check if application exists
    const application = await prisma.application.findUnique({
      where: { id: params.id }
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      stage,
      statusUpdatedAt: new Date()
    };

    // Handle stage-specific data
    switch (stage) {
      case 'ENDORSED':
        updateData.endorsedDate = new Date();
        break;
      case 'INTERVIEW_SCHEDULED':
        if (interviewDate) {
          updateData.interviewDate = new Date(interviewDate);
        }
        break;
      case 'EVALUATED':
        if (evaluationScore !== undefined) {
          updateData.evaluationScore = evaluationScore;
        }
        if (evaluationNotes) {
          updateData.evaluationNotes = evaluationNotes;
        }
        break;
      case 'HIRED':
        updateData.hiredAt = new Date();
        updateData.status = 'HIRED';
        break;
      case 'REJECTED':
        updateData.status = 'REJECTED';
        if (rejectionReason) {
          updateData.rejectionReason = rejectionReason;
        }
        break;
    }

    // Update the application
    const updatedApplication = await prisma.application.update({
      where: { id: params.id },
      data: updateData,
      include: {
        vacancy: {
          select: {
            title: true,
            college: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Application stage updated to ${stage}`,
      data: updatedApplication
    });

  } catch (error: any) {
    console.error('❌ Error updating application stage:', error);
    return NextResponse.json({
      error: 'Failed to update application stage',
      message: error.message
    }, { status: 500 });
  }
}