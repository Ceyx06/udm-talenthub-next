// src/app/api/hr/dashboard/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function daysBetween(a: Date, b: Date) {
    return Math.max(0, Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24)));
}

export async function GET() {
    try {
        const now = new Date();

        // ---- Open vacancies by department (count + avg days open)
        const openVacancies = await prisma.vacancy.findMany({
            where: { status: "OPEN" },
            select: { id: true, college: true, postedDate: true },
        });

        const openByDeptMap: Record<string, { dept: string; open: number; totalDays: number }> = {};
        for (const v of openVacancies) {
            const dept = v.college ?? "N/A";
            if (!openByDeptMap[dept]) openByDeptMap[dept] = { dept, open: 0, totalDays: 0 };
            openByDeptMap[dept].open += 1;
            openByDeptMap[dept].totalDays += daysBetween(now, v.postedDate);
        }
        const openByDept = Object.values(openByDeptMap).map((d) => ({
            dept: d.dept as any,
            open: d.open,
            avgDaysOpen: d.open ? +(d.totalDays / d.open).toFixed(1) : 0,
        }));

        // ---- Pipeline counts
        const [applicationsCnt, screeningCnt, interviewsCnt, offersCnt, acceptedCnt] = await Promise.all([
            prisma.application.count(), // total in funnel
            prisma.application.count({ where: { stage: "Screening" } }),
            prisma.application.count({ where: { stage: "Interview" } }),
            prisma.application.count({ where: { stage: "Offer" } }),
            prisma.application.count({ where: { status: "Hired" } }),
        ]);

        const pipeline = [
            { stage: "APPLICATIONS", count: applicationsCnt },
            { stage: "SCREENING", count: screeningCnt },
            { stage: "INTERVIEWS", count: interviewsCnt },
            { stage: "OFFERS", count: offersCnt },
            { stage: "ACCEPTED", count: acceptedCnt },
        ];

        // ---- Pending actions
        const [toReview, offersToApprove, contractsToRenew] = await Promise.all([
            prisma.application.count({ where: { status: "Pending" } }),
            prisma.application.count({
                where: { stage: "Offer", status: { in: ["Pending", "Reviewed", "Shortlisted"] } },
            }),
            prisma.renewal.count({ where: { status: "PENDING_DEAN" } }),
        ]);
        const pending = { toReview, offersToApprove, contractsToRenew };

        // ---- Time to fill: avg days from vacancy.postedDate to application.updatedAt for Hired
        const hired = await prisma.application.findMany({
            where: { status: "Hired" },
            select: { updatedAt: true, vacancy: { select: { college: true, postedDate: true } } },
        });

        const ttfMap: Record<string, { dept: string; total: number; n: number }> = {};
        for (const h of hired) {
            const dept = h.vacancy?.college ?? "N/A";
            if (!h.vacancy?.postedDate) continue;
            const d = daysBetween(h.updatedAt, h.vacancy.postedDate);
            if (!ttfMap[dept]) ttfMap[dept] = { dept, total: 0, n: 0 };
            ttfMap[dept].total += d;
            ttfMap[dept].n += 1;
        }
        const ttfByDept = Object.values(ttfMap).map((x) => ({
            dept: x.dept as any,
            avgDays: x.n ? +(x.total / x.n).toFixed(1) : 0,
        }));

        // ---- Filled progress (simple month/quarter/year counts of Hired)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const [monthFilled, quarterFilled, yearFilled] = await Promise.all([
            prisma.application.count({ where: { status: "Hired", updatedAt: { gte: startOfMonth } } }),
            prisma.application.count({ where: { status: "Hired", updatedAt: { gte: startOfQuarter } } }),
            prisma.application.count({ where: { status: "Hired", updatedAt: { gte: startOfYear } } }),
        ]);

        // Targets can be dynamic; for now, simple heuristics so UI has both value & target
        const filled = {
            month: { value: monthFilled, target: Math.max(5, monthFilled + 6) },
            quarter: { value: quarterFilled, target: Math.max(15, quarterFilled + 12) },
            year: { value: yearFilled, target: Math.max(60, yearFilled + 24) },
        };

        return NextResponse.json({
            openByDept,       // [{ dept, open, avgDaysOpen }]
            pipeline,         // [{ stage, count }]
            pending,          // { toReview, offersToApprove, contractsToRenew }
            ttfByDept,        // [{ dept, avgDays }]
            filled,           // { month:{value,target}, quarter:{...}, year:{...} }
        });
    } catch (err: any) {
        console.error("/api/hr/dashboard GET error:", err);
        return NextResponse.json({ error: err?.message ?? "Failed to load metrics" }, { status: 500 });
    }
}
