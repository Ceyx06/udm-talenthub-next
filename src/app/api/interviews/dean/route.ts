// app/api/interviews/dean/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {
      application: {
        stage: 'INTERVIEW_SCHEDULED'
      }
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Fetch interviews
    const interviews = await prisma.interview.findMany({
      where,
      include: {
        application: {
          include: {
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
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: interviews
    });

  } catch (error: any) {
    console.error('❌ Fetch interviews error:', error);
    return NextResponse.json({
      error: 'Failed to fetch interviews',
      message: error.message
    }, { status: 500 });
  }
}