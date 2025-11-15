// src/app/api/hr/applicants/[id]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if application exists
    const application = await prisma.application.findUnique({
      where: { id: params.id }
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Delete the application
    await prisma.application.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error deleting application:', error);
    return NextResponse.json({
      error: 'Failed to delete application',
      message: error.message
    }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        vacancy: {
          select: {
            title: true,
            college: true,
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: application
    });

  } catch (error: any) {
    console.error('❌ Error fetching application:', error);
    return NextResponse.json({
      error: 'Failed to fetch application',
      message: error.message
    }, { status: 500 });
  }
}