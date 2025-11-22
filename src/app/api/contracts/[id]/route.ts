import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const contract = await prisma.contract.update({
      where: { id },
      data: body,
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

    return NextResponse.json(contract);
  } catch (error: any) {
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { error: 'Failed to update contract', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.contract.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { error: 'Failed to delete contract', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}