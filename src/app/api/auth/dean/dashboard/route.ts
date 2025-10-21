// src/app/api/dean/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // avoid build-time caching

type DeanPayload = {
    avgRequestCycleTime: number;
    renewalRate: number;
    totalFaculty: number;
    unitCoverage: number;
    requestTrend: Array<{ month: string; submitted: number; approved: number; rejected: number }>;
    facultyMix: Array<{ type: string; count: number; percentage: number }>;
    departmentUnitLoad: Array<{ department: string; required: number; covered: number; gap: number; utilization: number }>;
    renewalRecommendations: Array<{ month: string; recommended: number; notRecommended: number; rate: number }>;
    recentRequests: Array<{ id: string; position: string; submittedDate: string; status: string; daysInProcess: number }>;
};

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const semester = searchParams.get("semester") || "2025-1";

        // Small semester-based nudges so the UI looks alive
        const offset = semester === "2024-2" ? -4 : semester === "2024-1" ? -8 : 0;

        const payload: DeanPayload = {
            avgRequestCycleTime: clamp(6.8 + offset * 0.1, 5.5, 9.5),
            renewalRate: clamp(72 + offset * 1.2, 60, 85),
            totalFaculty: 275 + offset * 2,
            unitCoverage: clamp(91 + offset * 0.8, 85, 98),

            requestTrend: [
                { month: "May", submitted: 18 + offset, approved: 12 + offset, rejected: 2 + Math.max(0, Math.floor(offset / 2)) },
                { month: "Jun", submitted: 20 + offset, approved: 14 + offset, rejected: 3 + Math.max(0, Math.floor(offset / 2)) },
                { month: "Jul", submitted: 16 + offset, approved: 9 + offset, rejected: 4 + Math.max(0, Math.floor(offset / 2)) },
                { month: "Aug", submitted: 19 + offset, approved: 11 + offset, rejected: 3 + Math.max(0, Math.floor(offset / 2)) },
                { month: "Sep", submitted: 21 + offset, approved: 15 + offset, rejected: 4 + Math.max(0, Math.floor(offset / 2)) },
                { month: "Oct", submitted: 22 + offset, approved: 13 + offset, rejected: 5 + Math.max(0, Math.floor(offset / 2)) },
            ],

            facultyMix: [
                { type: "Full-Time", count: 141 + offset, percentage: pct(141 + offset, 141 + offset + 102 + offset) },
                { type: "Part-Time", count: 102 + offset, percentage: pct(102 + offset, 141 + offset + 102 + offset) },
            ],

            departmentUnitLoad: [
                { department: "Math", required: 120, covered: 110 + offset, gap: (110 + offset) - 120, utilization: pct(110 + offset, 120) },
                { department: "CS", required: 150, covered: 142 + offset, gap: (142 + offset) - 150, utilization: pct(142 + offset, 150) },
                { department: "Biology", required: 98, covered: 86 + offset, gap: (86 + offset) - 98, utilization: pct(86 + offset, 98) },
                { department: "Psych", required: 105, covered: 105 + offset, gap: (105 + offset) - 105, utilization: pct(105 + offset, 105) },
                { department: "Business", required: 160, covered: 147 + offset, gap: (147 + offset) - 160, utilization: pct(147 + offset, 160) },
            ],

            renewalRecommendations: [
                { month: "Jun", recommended: 12 + offset, notRecommended: 3 + Math.max(0, Math.floor(offset / 2)), rate: pct(12 + offset, 15 + offset) },
                { month: "Jul", recommended: 9 + offset, notRecommended: 5 + Math.max(0, Math.floor(offset / 2)), rate: pct(9 + offset, 14 + offset) },
                { month: "Aug", recommended: 11 + offset, notRecommended: 3 + Math.max(0, Math.floor(offset / 2)), rate: pct(11 + offset, 14 + offset) },
                { month: "Sep", recommended: 15 + offset, notRecommended: 4 + Math.max(0, Math.floor(offset / 2)), rate: pct(15 + offset, 19 + offset) },
                { month: "Oct", recommended: 13 + offset, notRecommended: 5 + Math.max(0, Math.floor(offset / 2)), rate: pct(13 + offset, 18 + offset) },
            ],

            recentRequests: [
                { id: "r1", position: "Assistant Prof – CS", submittedDate: isoDaysAgo(7), status: "UNDER_REVIEW", daysInProcess: 7 },
                { id: "r2", position: "Lecturer – Math", submittedDate: isoDaysAgo(3), status: "PENDING", daysInProcess: 3 },
                { id: "r3", position: "Assoc Prof – Biology", submittedDate: isoDaysAgo(15), status: "APPROVED", daysInProcess: 15 },
            ],
        };

        // If you want to wire Prisma later, replace blocks above with .count/.findMany/.groupBy calls.
        // Example structure:
        // const cycle = await prisma.request.aggregate({ _avg: { cycleDays: true }, where: { semester } });

        return NextResponse.json(payload, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (err) {
        console.error("Dean dashboard API error:", err);
        return NextResponse.json({ error: "Failed to build dean metrics" }, { status: 500 });
    }
}

/* ================= helpers ================ */
function isoDaysAgo(days: number) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
}

function pct(numer: number, denom: number) {
    if (!denom || denom <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((numer / denom) * 100)));
}

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}
