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
        { error: 'Unauthorized. Only Deans can approve/reject applications.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { action, remarks } = body; // action: 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject".' },
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

    // Check if application is in ENDORSED stage
    if (application.stage !== 'ENDORSED') {
      return NextResponse.json(
        { error: 'Application is not in ENDORSED stage' },
        { status: 400 }
      );
    }

    // Check if application status is waiting for dean approval
    if (application.status !== 'PENDING_DEAN_APPROVAL') {
      return NextResponse.json(
        { error: 'Application is not pending dean approval' },
        { status: 400 }
      );
    }

    // Determine new stage and status based on action
    let newStage: string;
    let newStatus: string;

    if (action === 'approve') {
      newStage = 'APPROVED_BY_DEAN';
      newStatus = 'APPROVED';
    } else {
      newStage = 'REJECTED_BY_DEAN';
      newStatus = 'REJECTED';
    }

    // Update application with dean's decision
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        stage: newStage,
        status: newStatus,
        statusUpdatedAt: new Date(),
        // Store dean remarks in rejectionReason field (you might want to add a deanRemarks field)
        ...(remarks && { rejectionReason: remarks }),
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

    console.log(`✅ Application ${id} ${action}d by Dean (${session.user.email})`);

    // TODO: Send notification to HR
    // Example:
    // await sendNotificationToHR({
    //   applicationId: id,
    //   applicantName: application.fullName,
    //   position: application.vacancy?.title,
    //   action: action,
    //   deanName: session.user.name
    // });

    return NextResponse.json({
      success: true,
      message: `Application ${action}d successfully`,
      data: updatedApplication,
      action: action
    });

  } catch (error: any) {
    console.error('❌ Dean action error:', error);
    return NextResponse.json({
      error: 'Failed to process dean action',
      message: error.message
    }, { status: 500 });
  }
}