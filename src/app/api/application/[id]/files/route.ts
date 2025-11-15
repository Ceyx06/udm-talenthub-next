// src/app/api/application/[id]/files/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and has HR role
    if (!session || session.user.role !== 'HR') {
      return NextResponse.json(
        { error: 'Unauthorized. Only HR can update file status.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { fileStatus } = body;

    // Validate file status
    const validStatuses = ['pending', 'partial', 'complete', 'incomplete'];
    if (!validStatuses.includes(fileStatus)) {
      return NextResponse.json(
        { error: 'Invalid file status' },
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

    // For now, we'll store file status in the message field or create a new field
    // You can add a `fileStatus` field to your Prisma schema later
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        message: fileStatus, // Temporary storage, consider adding fileStatus field to schema
        statusUpdatedAt: new Date(),
      },
      include: {
        vacancy: {
          select: {
            title: true,
            college: true,
          }
        }
      }
    });

    console.log(`✅ File status updated for application ${id}: ${fileStatus}`);

    return NextResponse.json({
      success: true,
      message: 'File status updated successfully',
      data: updatedApplication
    });

  } catch (error: any) {
    console.error('❌ Update file status error:', error);
    return NextResponse.json({
      error: 'Failed to update file status',
      message: error.message
    }, { status: 500 });
  }
}