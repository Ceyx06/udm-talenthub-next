// app/api/interviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/interviews - Fetch all interviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const applicationId = searchParams.get('applicationId');

    let whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (applicationId) {
      whereClause.applicationId = applicationId;
    }

    const interviews = await prisma.interview.findMany({
      where: whereClause,
      include: {
        application: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            desiredPosition: true,
            department: true,
            qrCode: true,
            vacancy: {
              select: {
                title: true,
                college: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(interviews);
  } catch (error: any) {
    console.error('GET /api/interviews error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch interviews' },
      { status: 500 }
    );
  }
}

// POST /api/interviews - Create new interview
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, interviewDate, teachingDemoDate, notes, location, interviewers } = body;

    // Validate required fields
    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Check if application exists
    const application = await prisma.application.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if interview already exists for this application
    const existingInterview = await prisma.interview.findFirst({
      where: { applicationId }
    });

    if (existingInterview) {
      return NextResponse.json(
        { error: 'Interview already scheduled for this application' },
        { status: 400 }
      );
    }

    // Generate interview ID
    const count = await prisma.interview.count();
    const interviewId = `A${String(count + 1).padStart(3, '0')}`;

    // Create interview
    const interview = await prisma.interview.create({
      data: {
        interviewId,
        applicationId,
        interviewDate: interviewDate ? new Date(interviewDate) : undefined,
        teachingDemoDate: teachingDemoDate ? new Date(teachingDemoDate) : undefined,
        status: interviewDate ? 'Scheduled' : 'Pending',
        notes: notes || undefined,
        location: location || undefined,
        interviewers: interviewers || undefined,
      },
      include: {
        application: true,
      },
    });

    // Update application stage to Interview
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        stage: 'Interview',
        status: 'Reviewed' // Mark as reviewed when interview is scheduled
      },
    });

    console.log('Interview created successfully:', interview.id);

    return NextResponse.json({
      success: true,
      message: 'Interview scheduled successfully',
      interview
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/interviews error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create interview' },
      { status: 500 }
    );
  }
}