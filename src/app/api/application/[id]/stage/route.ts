// src/app/api/applications/[id]/stage/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { stage, userRole, notes } = body;

    // Define valid stage transitions
    const validStages = [
      'APPLIED',
      'ENDORSED',
      'INTERVIEW_SCHEDULED',
      'EVALUATED',
      'FOR_HIRING',
      'HIRED',
      'REJECTED'
    ];

    if (!validStages.includes(stage)) {
      return NextResponse.json(
        { error: 'Invalid stage' },
        { status: 400 }
      );
    }

    // Check if application exists
    const application = await prisma.application.findUnique({
      where: { id }
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Role-based stage validation
    const deanStages = ['ENDORSED', 'REJECTED'];
    const hrStages = ['INTERVIEW_SCHEDULED', 'EVALUATED', 'FOR_HIRING', 'HIRED', 'REJECTED'];

    if (userRole === 'DEAN' && !deanStages.includes(stage)) {
      return NextResponse.json(
        { error: 'Dean can only endorse or reject applications' },
        { status: 403 }
      );
    }

    if (userRole === 'HR' && !hrStages.includes(stage)) {
      return NextResponse.json(
        { error: 'Invalid stage transition for HR' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {
      stage,
      statusUpdatedAt: new Date(),
    };

    // Update stage-specific dates
    switch (stage) {
      case 'ENDORSED':
        updateData.endorsedDate = new Date();
        updateData.status = 'ENDORSED';
        break;
      case 'INTERVIEW_SCHEDULED':
        updateData.interviewDate = new Date();
        updateData.status = 'INTERVIEW_SCHEDULED';
        break;
      case 'EVALUATED':
        updateData.status = 'EVALUATED';
        if (notes) {
          updateData.evaluationNotes = notes;
        }
        break;
      case 'FOR_HIRING':
        updateData.status = 'FOR_HIRING';
        break;
      case 'HIRED':
        updateData.hiredAt = new Date();
        updateData.status = 'HIRED';
        // Generate employee ID
        updateData.employeeId = `EMP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        break;
      case 'REJECTED':
        updateData.status = 'REJECTED';
        if (notes) {
          updateData.rejectionReason = notes;
        }
        break;
    }

    // Update the application
    const updatedApplication = await prisma.application.update({
      where: { id },
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
      message: `Application ${stage.toLowerCase().replace('_', ' ')} successfully`,
      data: updatedApplication
    });

  } catch (error: any) {
    console.error('❌ Stage update error:', error);
    return NextResponse.json({
      error: 'Failed to update application stage',
      message: error.message
    }, { status: 500 });
  }
}