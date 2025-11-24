  // src/app/api/application/[id]/endorse/route.ts

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
      
      if (!session || session.user.role !== 'HR') {
        return NextResponse.json(
          { error: 'Unauthorized. Only HR can endorse applications.' },
          { status: 401 }
        );
      }

      const { id } = params;

      const application = await prisma.application.findUnique({
        where: { id },
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

      if (application.endorsedDate) {
        return NextResponse.json(
          { error: 'Application already endorsed to Dean' },
          { status: 400 }
        );
      }

      const requiredFiles = ['pdsUrl', 'transcriptUrl', 'trainingsUrl', 'employmentUrl'];
      const missingFiles = requiredFiles.filter(file => !application[file as keyof typeof application]);
      
      if (missingFiles.length > 0) {
        return NextResponse.json(
          { 
            error: 'Cannot endorse application with incomplete files',
            missingFiles 
          },
          { status: 400 }
        );
      }

      // ============ FIXED: Change stage to PENDING_DEAN_APPROVAL ============
      const updatedApplication = await prisma.application.update({
  where: { id },
  data: {
    stage: 'PENDING_DEAN_APPROVAL',
    status: 'UNDER_REVIEW',
    endorsedDate: new Date(),
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
      // ======================================================================

      console.log(`✅ Application ${id} endorsed to Dean by HR - Awaiting Dean approval`);

      return NextResponse.json({
        success: true,
        message: 'Application endorsed to Dean successfully. Waiting for Dean approval.',
        data: updatedApplication
      });

    } catch (error: any) {
      console.error('❌ Endorse application error:', error);
      return NextResponse.json({
        error: 'Failed to endorse application',
        message: error.message
      }, { status: 500 });
    }
  }