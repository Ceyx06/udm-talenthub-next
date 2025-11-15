// app/api/dean/applicants/[id]/endorse/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // FIX 1: Await params (Next.js 15 requirement)
    const { id: applicantId } = await params;
    
    const body = await req.json();
    const { userId } = body; // Pass userId from frontend

    // FIX 2: Use prisma.application instead of prisma.applicant
    const existingApplicant = await prisma.application.findUnique({
      where: { id: applicantId }
    });

    if (!existingApplicant) {
      return NextResponse.json(
        { error: 'Applicant not found' },
        { status: 404 }
      );
    }

    // ✅ Just update the stage - DON'T DELETE
    const updatedApplicant = await prisma.application.update({
      where: { id: applicantId },
      data: {
        stage: 'ENDORSED',
        endorsedDate: new Date(), // Use endorsedDate (from your schema)
        // endorsedById: userId, // Remove this - field doesn't exist in schema
      },
      include: {
        vacancy: true,
      }
    });

    return NextResponse.json({
      success: true,
      applicant: updatedApplicant,
      message: 'Applicant endorsed to Dean successfully'
    });

  } catch (error) {
    console.error('Endorse error:', error);
    return NextResponse.json(
      { error: 'Failed to endorse applicant' },
      { status: 500 }
    );
  }
}