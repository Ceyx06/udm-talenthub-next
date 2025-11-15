// src/app/api/hr/applicants/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vacancyId = searchParams.get('vacancyId');
    const stage = searchParams.get('stage');

    const where: any = {};
    if (vacancyId) where.vacancyId = vacancyId;
    if (stage && stage !== 'ALL') where.stage = stage;

    const applications = await prisma.application.findMany({
      where,
      include: {
        vacancy: {
          select: {
            id: true,
            title: true,
            college: true,
          }
        }
      },
      orderBy: { appliedDate: 'desc' }
    });

    // Map the data to match what the frontend expects
    const mappedApplications = applications.map((app: any) => ({
      id: app.id,
      fullName: app.fullName,
      firstName: app.firstName,
      lastName: app.lastName,
      name: app.fullName,
      email: app.email,
      phone: app.phone,
      contactNo: app.contactNo,
      jobTitle: app.desiredPosition || app.vacancy?.title || '—',
      college: app.department || app.vacancy?.college || '—',
      stage: app.stage || 'APPLIED',
      status: app.status,
      appliedAt: app.appliedDate,
      
      // Document URLs
      pdsUrl: app.pdsUrl,
      transcriptUrl: app.transcriptUrl,
      trainingsUrl: app.trainingsUrl,
      employmentUrl: app.employmentUrl,
      
      // Interview & Evaluation (only if they exist)
      interviewDate: app.interviewDate || null,
      evaluationScore: app.evaluationScore || null,
      evaluationNotes: app.evaluationNotes || null,
      rejectionReason: app.rejectionReason || null,
      
      // Timestamps (only if they exist)
      endorsedAt: app.endorsedDate || null,
      hiredAt: app.hiredAt || null,
      
      vacancy: app.vacancy,
    }));

    return NextResponse.json({
      success: true,
      data: mappedApplications
    });

  } catch (error: any) {
    console.error('❌ Error fetching applicants:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch applications',
      message: error.message
    }, { status: 500 });
  }
}