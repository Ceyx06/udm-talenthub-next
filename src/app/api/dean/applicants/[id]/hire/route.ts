// app/api/dean/applicants/[id]/hire/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface HireRequest {
  facultyType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTUAL';
  startDate: string;
  endDate: string;
  ratePerHour: number;
  employeeId: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'HR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // FIX 1: Await params (Next.js 15 requirement)
    const { id: applicantId } = await params;
    const body: HireRequest = await req.json();

    // FIX 2: Use prisma.application instead of prisma.applicant
    const applicant = await prisma.application.findUnique({
      where: { id: applicantId },
      include: { vacancy: true }
    });

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    if (applicant.stage !== 'FOR_HIRING') {
      return NextResponse.json(
        { error: 'Applicant must be in FOR_HIRING stage' },
        { status: 400 }
      );
    }

    // Use a transaction to ensure data integrity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update applicant stage to HIRED and store hire info
      const updatedApplicant = await tx.application.update({
        where: { id: applicantId },
        data: { 
          stage: 'HIRED',
          employeeId: body.employeeId,
          hiredAt: new Date(body.startDate),
        }
      });

      // 2. Create Faculty record based on your actual Faculty schema
      const fullName = applicant.fullName || 
        `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim();
      
      const faculty = await tx.faculty.create({
        data: {
          name: fullName,
          position: applicant.vacancy?.title || 'Faculty',
          type: body.facultyType,
          contract: body.employeeId, // Using employeeId as contract reference
          recommendation: 'HIRED',
          actions: `Hired on ${new Date(body.startDate).toLocaleDateString()}`,
        }
      });

      // Note: Contract creation removed as it's not in your schema
      // If you need contracts, add a Contract model to your schema

      return { applicant: updatedApplicant, faculty };
    });

    return NextResponse.json({
      success: true,
      message: 'Applicant hired successfully',
      data: result
    });

  } catch (error) {
    console.error('Hire applicant error:', error);
    return NextResponse.json(
      { error: 'Failed to hire applicant' },
      { status: 500 }
    );
  }
}