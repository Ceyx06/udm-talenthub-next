import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const contracts = await prisma.contract.findMany({
      include: {
        evaluation: {
          include: {
            application: {
              include: {
                vacancy: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(contracts);
  } catch (error: any) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      evaluationId,
      facultyName,
      email,
      phone,
      college,
      jobTitle,
      position,
      employmentType,
      ratePerHour,
      startDate,
      endDate,
      createdBy,
    } = body;

    // Generate contract number
    const year = new Date().getFullYear();
    const count = await prisma.contract.count();
    const contractNo = `C-${year}-${String(count + 1).padStart(3, '0')}`;

    const contract = await prisma.contract.create({
      data: {
        contractNo,
        evaluationId,
        facultyName,
        email,
        phone,
        college,
        jobTitle,
        position,
        employmentType,
        ratePerHour,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'Active',
        createdBy,
      },
      include: {
        evaluation: {
          include: {
            application: {
              include: {
                vacancy: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error: any) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: 'Failed to create contract', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}