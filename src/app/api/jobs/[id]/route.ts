import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public: single vacancy (open & not expired)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
    try {
        const cutoff = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
        const v = await prisma.vacancy.findFirst({
            where: { id: params.id, status: "OPEN", postedDate: { gte: cutoff } },
            select: {
                id: true,
                title: true,
                college: true,
                status: true,
                requirements: true,
                description: true,
                postedDate: true
            },
        });
        if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ data: v });
    } catch (e: any) {
        console.error('Error fetching vacancy:', e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}