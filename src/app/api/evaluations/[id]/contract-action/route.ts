import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { contractStatus, contractActionDate, actionBy } = body;

    // Update evaluation with contract status
    const updatedEvaluation = await prisma.evaluation.update({
      where: { id },
      data: {
        contractStatus,
        contractActionDate: contractActionDate ? new Date(contractActionDate) : new Date(),
      },
      include: {
        application: {
          include: {
            vacancy: true,
          },
        },
      },
    });

    // If approved, create a contract
    if (contractStatus === 'approved') {
      // Update application stage
      await prisma.application.update({
        where: { id: updatedEvaluation.applicationId },
        data: {
          stage: 'HIRED',
        },
      });

      // Check if contract already exists
      const existingContract = await prisma.contract.findUnique({
        where: { evaluationId: id },
      });

      if (!existingContract) {
        // Generate contract number
        const year = new Date().getFullYear();
        const count = await prisma.contract.count();
        const contractNo = `C-${year}-${String(count + 1).padStart(3, '0')}`;

        // Calculate contract dates (e.g., 1 year contract)
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);

        // Create contract with employment type from application
        await prisma.contract.create({
          data: {
            contractNo,
            evaluationId: id,
            facultyName: updatedEvaluation.application?.fullName || 'Unknown',
            email: updatedEvaluation.application?.email || '',
            phone: updatedEvaluation.application?.phone || updatedEvaluation.application?.contactNo || '',
            college: updatedEvaluation.application?.vacancy?.college || 
                     updatedEvaluation.application?.department || 'N/A',
            jobTitle: updatedEvaluation.application?.vacancy?.title || 
                      updatedEvaluation.application?.desiredPosition || 'N/A',
            position: updatedEvaluation.rank || 'N/A',
            employmentType: updatedEvaluation.application?.employmentType || 'Full-time', // ✅ Gets from application
            ratePerHour: updatedEvaluation.ratePerHour || 0,
            startDate,
            endDate,
            status: 'Active',
            createdBy: actionBy,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedEvaluation,
      message: contractStatus === 'approved' 
        ? 'Contract approved and created successfully' 
        : 'Contract declined successfully',
    });
  } catch (error: any) {
    console.error('Error updating contract status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update contract status' },
      { status: 500 }
    );
  }
}