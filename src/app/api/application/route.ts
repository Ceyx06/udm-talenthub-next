// src/app/api/application/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('📝 Received application:', body);

    // Validate required fields
    const required = ['vacancyId', 'firstName', 'lastName', 'email', 'contactNo'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate files
    if (!body.pdsUrl || !body.transcriptUrl || !body.trainingsUrl || !body.employmentUrl) {
      return NextResponse.json(
        { error: 'All required documents must be uploaded' },
        { status: 400 }
      );
    }

    // Check if vacancy exists and is still active
    const vacancy = await prisma.vacancy.findUnique({
      where: { id: body.vacancyId }
    });

    if (!vacancy) {
      return NextResponse.json(
        { error: 'Vacancy not found' },
        { status: 404 }
      );
    }

    // Check if application period is still valid (15 days)
    const postedDate = new Date(vacancy.postedDate).getTime();
    const now = Date.now();
    const daysPassed = (now - postedDate) / (1000 * 60 * 60 * 24);

    if (daysPassed > 15) {
      return NextResponse.json(
        { error: 'This vacancy is no longer accepting applications' },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const existingApplication = await prisma.application.findFirst({
      where: {
        vacancyId: body.vacancyId,
        email: body.email
      }
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this position' },
        { status: 409 }
      );
    }

    // Generate QR code
    const qrCode = `APP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`.toUpperCase();

    // Create application
    const application = await prisma.application.create({
      data: {
        vacancyId: body.vacancyId,
        
        // Required fields
        fullName: body.fullName || `${body.firstName} ${body.middleName || ''} ${body.lastName}`.trim(),
        email: body.email,
        phone: body.contactNo,
        coverLetter: body.coverLetter || '',
        resumeUrl: body.resumeUrl || body.pdsUrl,
        
        // Personal info
        firstName: body.firstName,
        middleName: body.middleName,
        lastName: body.lastName,
        contactNo: body.contactNo,
        dob: body.dob ? new Date(body.dob) : null,
        gender: body.gender,
        civilStatus: body.civilStatus,
        presentAddress: body.presentAddress,
        permanentAddress: body.permanentAddress,
        nationality: body.nationality,
        idType: body.idType,
        idNumber: body.idNumber,
        
        // Position
        desiredPosition: body.desiredPosition || vacancy.title,
        department: body.department || vacancy.college,
        employmentType: body.employmentType,
        
        // Education
        highestDegree: body.highestDegree,
        trainingHours: body.trainingHours ? parseInt(body.trainingHours) : null,
        licenseName: body.licenseName,
        licenseNo: body.licenseNo,
        licenseExpiry: body.licenseExpiry ? new Date(body.licenseExpiry) : null,
        
        // Documents
        pdsUrl: body.pdsUrl,
        transcriptUrl: body.transcriptUrl,
        trainingsUrl: body.trainingsUrl,
        employmentUrl: body.employmentUrl,
        
        // Experience & References as JSON
        experiences: body.experiences || [],
        references: body.references || [],
        
        // Status
        status: 'PENDING',
        stage: 'APPLIED',
        qrCode: qrCode,
        appliedDate: new Date(),
      }
    });

    console.log('✅ Application created:', application.id);

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: application.id,
      qrCode: qrCode,
      data: application
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Application submission error:', error);
    
    return NextResponse.json({
      error: 'Failed to submit application',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// GET to retrieve applications (optional)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const vacancyId = searchParams.get('vacancyId');

    const where: any = {};
    if (email) where.email = email;
    if (vacancyId) where.vacancyId = vacancyId;

    const applications = await prisma.application.findMany({
      where,
      include: {
        vacancy: {
          select: {
            title: true,
            college: true,
          }
        }
      },
      orderBy: { appliedDate: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: applications
    });

  } catch (error: any) {
    console.error('❌ Get applications error:', error);
    return NextResponse.json({
      error: 'Failed to fetch applications'
    }, { status: 500 });
  }
}