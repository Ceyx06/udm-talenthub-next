import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/applications/[id] - Update application (for endorsement, status changes, etc.)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();

        console.log("Updating application:", id, body);

        // Handle endorsement action
        if (body.action === 'endorse') {
            const application = await prisma.application.update({
                where: { id },
                data: {
                    endorsedDate: new Date(),
                    status: 'Reviewed',
                },
            });

            return NextResponse.json({
                success: true,
                message: "Application endorsed successfully",
                application,
            });
        }

        // Handle general updates (remove 'action' from body if present)
        const { action, ...updateData } = body;

        const application = await prisma.application.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            message: "Application updated successfully",
            application,
        });

    } catch (error: any) {
        console.error("PATCH /api/applications/[id] error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update application" },
            { status: 500 }
        );
    }
}

// DELETE /api/applications/[id] - Delete application
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        await prisma.application.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "Application deleted successfully",
        });

    } catch (error: any) {
        console.error("DELETE /api/applications/[id] error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete application" },
            { status: 500 }
        );
    }
}

// GET /api/applications/[id] - Get single application
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const application = await prisma.application.findUnique({
            where: { id },
            include: {
                vacancy: {
                    select: {
                        title: true,
                        college: true,
                    },
                },
            },
        });

        if (!application) {
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(application);

    } catch (error: any) {
        console.error("GET /api/applications/[id] error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch application" },
            { status: 500 }
        );
    }
}