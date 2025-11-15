import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { applicationId, reason } = await request.json();

    // Update interview status back to Pending
    await prisma.interview.update({
      where: { id },
      data: {
        status: 'Pending',
        notes: reason || 'Marked incomplete - needs rescheduling',
        updatedAt: new Date()
      }
    });

    // Move application back to PENDING stage
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        stage: 'PENDING',
        status: 'PENDING',
        statusUpdatedAt: new Date(),
        rejectionReason: reason
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Interview marked as incomplete'
    });
  } catch (error: any) {
    console.error('Error marking interview incomplete:', error);
    return NextResponse.json({
      error: 'Failed to mark interview as incomplete',
      message: error.message
    }, { status: 500 });
  }
}