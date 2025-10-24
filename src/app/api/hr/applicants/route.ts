import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const vacancyId = searchParams.get("vacancyId") || undefined;
        const stage = searchParams.get("stage") || undefined;

        const where: any = {};
        if (vacancyId) where.vacancyId = vacancyId;
        if (stage) where.OR = [{ stage }, { status: stage }];

        const apps = await prisma.application.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: { vacancy: { select: { title: true, college: true } } },
        });

        return NextResponse.json({ data: apps });
    } catch (e: any) {
        return new NextResponse(JSON.stringify({ error: e?.message || "Server error" }), { status: 500 });
    }
}
