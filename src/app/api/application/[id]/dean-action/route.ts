// src/app/api/application/[id]/dean-action/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and has DEAN role
    if (!session || session.user.role !== 'DEAN') {
      return NextResponse.json(
        { error: 'Unauthorized. Only Dean can approve/disapprove applications.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { action, remarks } = body; // action: 'APPROVE' or 'DISAPPROVE'

    if (!action || !['APPROVE', 'DISAPPROVE'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be APPROVE or DISAPPROVE.' },
        { status: 400 }
      );
    }

    // Check if application exists
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        vacancy: {
          select: {
            title: true,
            college: true,
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if application is pending dean approval
    if (application.stage !== 'PENDING_DEAN_APPROVAL') {
      return NextResponse.json(
        { error: `Cannot review application. Current stage: ${application.stage}` },
        { status: 400 }
      );
    }

    // Update application based on action
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        stage: action === 'APPROVE' ? 'ENDORSED' : 'DISAPPROVED',
        status: action === 'APPROVE' ? 'READY_FOR_INTERVIEW' : 'REJECTED',
        deanReviewedDate: new Date(),
        deanReviewedBy: session.user.id,
        deanRemarks: remarks || null,
        statusUpdatedAt: new Date(),
      },
      include: {
        vacancy: {
          select: {
            title: true,
            college: true,
          }
        }
      }
    });

    const actionText = action === 'APPROVE' ? 'approved' : 'disapproved';
    console.log(`✅ Application ${id} ${actionText} by Dean`);

    return NextResponse.json({
      success: true,
      message: `Application ${actionText} successfully.${action === 'APPROVE' ? ' HR can now schedule interview.' : ''}`,
      data: updatedApplication
    });

  } catch (error: any) {
    console.error('❌ Dean action error:', error);
    return NextResponse.json({
      error: 'Failed to process dean action',
      message: error.message
    }, { status: 500 });
  }
}