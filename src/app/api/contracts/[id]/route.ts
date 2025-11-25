import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch a single contract by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const contract = await prisma.contract.findUnique({
      where: { id },
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

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: contract });
  } catch (error: any) {
    console.error('Error fetching contract:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update a contract
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if contract exists
    const existingContract = await prisma.contract.findUnique({
      where: { id },
    });

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Validate dates if provided
    if (body.startDate && body.endDate) {
      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);
      
      if (endDate <= startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (body.facultyName !== undefined) updateData.facultyName = body.facultyName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.college !== undefined) updateData.college = body.college;
    if (body.jobTitle !== undefined) updateData.jobTitle = body.jobTitle;
    if (body.position !== undefined) updateData.position = body.position || null;
    if (body.employmentType !== undefined) updateData.employmentType = body.employmentType;
    if (body.ratePerHour !== undefined) updateData.ratePerHour = parseFloat(body.ratePerHour) || 0;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);
    if (body.status !== undefined) updateData.status = body.status;

    // Update the contract
    const updatedContract = await prisma.contract.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      data: updatedContract,
      message: 'Contract updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { error: 'Failed to update contract', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a contract
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if contract exists
    const existingContract = await prisma.contract.findUnique({
      where: { id },
    });

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Delete the contract
    await prisma.contract.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Contract deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { error: 'Failed to delete contract', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}