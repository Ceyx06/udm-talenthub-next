import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/interviews/[id] - Update interview status
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();

        const interview = await prisma.interview.update({
            where: { id },
            data: body,
        });

        return NextResponse.json({
            success: true,
            message: "Interview updated successfully",
            interview,
        });

    } catch (error: any) {
        console.error("PATCH /api/interviews/[id] error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update interview" },
            { status: 500 }
        );
    }
}