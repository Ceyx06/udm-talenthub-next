// src/app/api/faculty/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const college = searchParams.get('college');

    console.log('=== API REQUEST ===');
    console.log('Status filter:', status);
    console.log('College filter:', college);

    // Build the where clause
    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (college) whereClause.college = college;

    console.log('Where clause:', whereClause);

    // Get all contracts with their evaluations and applications
    const contracts = await prisma.contract.findMany({
      where: whereClause,
      include: {
        evaluation: {
          include: {
            application: {
              select: {
                fullName: true,
                email: true,
                phone: true,
                department: true,
                desiredPosition: true,
                employmentType: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Contracts found:', contracts.length);
    if (contracts.length > 0) {
      console.log('Sample contract college:', contracts[0].college);
      console.log('All unique colleges:', [...new Set(contracts.map(c => c.college))]);
    }

    // Transform the data to match frontend needs
    const faculty = contracts.map((contract) => ({
      id: contract.id,
      name: contract.facultyName,
      email: contract.email,
      phone: contract.phone || contract.evaluation?.application.phone || 'N/A',
      college: contract.college,
      position: contract.position,
      jobTitle: contract.jobTitle,
      employmentType: contract.employmentType,
      status: contract.status,
      ratePerHour: contract.ratePerHour,
      startDate: contract.startDate,
      endDate: contract.endDate,
      contractNo: contract.contractNo,
      createdAt: contract.createdAt,
    }));

    return NextResponse.json({
      success: true,
      faculty,
      count: faculty.length,
    });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch faculty members' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
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
      evaluationId,
    } = body;

    if (!facultyName || !email || !college || !position || !employmentType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const contractNo = `CONTRACT-${Date.now()}`;

    const contract = await prisma.contract.create({
      data: {
        contractNo,
        facultyName,
        email,
        phone,
        college,
        jobTitle: jobTitle || position,
        position,
        employmentType,
        ratePerHour: ratePerHour || 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'Active',
        ...(evaluationId && { evaluationId }),
      },
    });

    return NextResponse.json({
      success: true,
      contract,
      message: 'Faculty member added successfully',
    });
  } catch (error) {
    console.error('Error creating faculty:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create faculty member' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}