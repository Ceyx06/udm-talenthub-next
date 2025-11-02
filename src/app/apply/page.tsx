// app/api/vacancies/[id]/route.ts
// This is a PUBLIC API route for applicants to view job details
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET single vacancy by ID (PUBLIC - for job applicants)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
    try {
        console.log('🔍 [PUBLIC] Fetching vacancy with ID:', params.id);

        const vacancy = await prisma.vacancy.findUnique({
            where: { id: params.id },
            select: {
                id: true,
                title: true,
                college: true,
                description: true,
                requirements: true,
                status: true,
                postedDate: true,
                createdAt: true,
                _count: {
                    select: { applications: true }
                }
            }
        });

        if (!vacancy) {
            console.log('❌ Vacancy not found:', params.id);
            return NextResponse.json(
                { error: "Vacancy not found" },
                { status: 404 }
            );
        }

        // Check if vacancy is still accepting applications
        const postedDate = new Date(vacancy.postedDate).getTime();
        const now = Date.now();
        const daysPassed = (now - postedDate) / (1000 * 60 * 60 * 24);

        console.log('✅ Found vacancy:', vacancy.title);
        console.log('📅 Days since posted:', Math.floor(daysPassed));
        console.log('📊 Status:', vacancy.status);

        return NextResponse.json({
            ...vacancy,
            daysRemaining: Math.max(0, 15 - Math.floor(daysPassed))
        });
    } catch (e: any) {
        console.error("❌ GET /api/vacancies/:id error:", e);
        return NextResponse.json(
            { error: "Failed to fetch vacancy" },
            { status: 500 }
        );
    }
}