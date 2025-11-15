import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { interviewDate, teachingDemoDate } = body;

    console.log('📅 Scheduling interview:', { id, interviewDate, teachingDemoDate });

    if (!interviewDate || !teachingDemoDate) {
      return NextResponse.json(
        { error: 'Both interview and demo dates are required' },
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

    // -------------------------------------------------------
    // OPTION B: FIND FIRST THEN CREATE OR UPDATE
    // -------------------------------------------------------
    const existingInterview = await prisma.interview.findFirst({
      where: { applicationId: id }
    });

    let interview;

    if (existingInterview) {
      // Update existing interview
      interview = await prisma.interview.update({
        where: { id: existingInterview.id },
        data: {
          interviewDate: new Date(interviewDate),
          teachingDemoDate: new Date(teachingDemoDate),
          status: 'Scheduled',
        }
      });
    } else {
      // Create new interview
      interview = await prisma.interview.create({
        data: {
          interviewId: `INT-${Date.now()}`,
          applicationId: id,
          interviewDate: new Date(interviewDate),
          teachingDemoDate: new Date(teachingDemoDate),
          status: 'Scheduled',
        }
      });
    }

    // Update the application status and stage
    await prisma.application.update({
      where: { id },
      data: {
        stage: 'INTERVIEW_SCHEDULED',
        status: 'INTERVIEW_SCHEDULED',
        interviewDate: new Date(interviewDate),
        demoDate: new Date(teachingDemoDate),
        statusUpdatedAt: new Date(),
      }
    });

    console.log('✅ Interview scheduled successfully');

    return NextResponse.json({
      success: true,
      message: 'Interview scheduled successfully',
      data: interview
    });

  } catch (error: any) {
    console.error('❌ Schedule interview error:', error);
    return NextResponse.json({
      error: 'Failed to schedule interview',
      message: error.message
    }, { status: 500 });
  }
}
