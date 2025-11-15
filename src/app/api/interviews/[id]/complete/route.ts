import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { applicationId } = await request.json();

    // Update interview status to Completed
    await prisma.interview.update({
      where: { id },
      data: {
        status: 'Completed',
        updatedAt: new Date()
      }
    });

    // Update application stage to EVALUATED
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        stage: 'EVALUATED',
        status: 'EVALUATED',
        statusUpdatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Interview marked as complete'
    });
  } catch (error: any) {
    console.error('Error marking interview complete:', error);
    return NextResponse.json({
      error: 'Failed to mark interview as complete',
      message: error.message
    }, { status: 500 });
  }
}