// src/app/api/hr/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // avoid build-time caching

type TrendPoint = { month: string; requests: number };
type RenewalSlice = { status: string; count: number; percentage: number };
type CollegeRow = { college: string; open: number; filled: number; avgDays: number };
type PipelineRow = { stage: string; count: number; conversionRate: number };
type UrgentRow = { id: string; facultyName: string; endDate: string; daysLeft: number; status: string };

interface HRPayload {
    totalVacancies: number;
    activeApplications: number;
    pendingRenewals: number;
    avgTimeToFill: number;
    hiringTrend: TrendPoint[];
    renewalStats: RenewalSlice[];
    vacancyByCollege: CollegeRow[];
    applicantPipeline: PipelineRow[];
    urgentContracts: UrgentRow[];
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const rangeDays = clamp(parseInt(searchParams.get("range") || "30", 10) || 30, 7, 365);

        // Offset creates small, realistic variation by range
        const offset = rangeDays >= 365 ? 4 : rangeDays >= 90 ? 2 : rangeDays >= 30 ? 1 : 0;

        // ===== KPI mocks =====
        const totalVacancies = 37 + offset;        // OPEN + DRAFT
        const activeApplications = 182 + offset * 3;
        const pendingRenewals = 12 + Math.max(0, offset - 1);
        const avgTimeToFill = clamp(15.6 - offset * 0.6, 10, 18.5); // days

        // ===== Hiring requests trend (last up to 12 months) =====
        const monthsToMake = Math.min(Math.ceil(rangeDays / 30), 12);
        const hiringTrend: TrendPoint[] = buildTrend(monthsToMake, 9 + offset, 24 + offset);

        // ===== Renewal donut =====
        const renewed = 44 + offset;
        const notRenewed = 18 + Math.max(0, offset - 1);
        const pending = 7 + Math.max(0, offset - 2);
        const renewTotal = renewed + notRenewed + pending;
        const renewalStats: RenewalSlice[] = [
            { status: "Renewed", count: renewed, percentage: pct(renewed, renewTotal) },
            { status: "Not Renewed", count: notRenewed, percentage: pct(notRenewed, renewTotal) },
            { status: "Pending", count: pending, percentage: pct(pending, renewTotal) },
        ];

        // ===== Vacancy by college (open vs filled + avg days) =====
        const colleges = ["CAS", "CHS", "CBPM", "CCJ", "CED", "CCS"];
        const vacancyByCollege: CollegeRow[] = colleges.map((code, i) => {
            const open = clamp(6 - (i % 3) + offset - 1, 1, 8);
            const filled = clamp(5 + (i % 4) + offset, 4, 14);
            const avgDays = clamp(12 + i * 0.9 + offset * 0.7, 11, 18);
            return { college: code, open, filled, avgDays: round1(avgDays) };
        });

        // ===== Applicant pipeline (stage counts + step conversion %) =====
        const pipelineBase = [
            { stage: "SUBMITTED", count: 420 + offset * 8 },
            { stage: "SCREENING", count: 335 + offset * 6 },
            { stage: "INTERVIEW", count: 260 + offset * 5 },
            { stage: "EVALUATION", count: 190 + offset * 4 },
            { stage: "OFFER", count: 140 + offset * 3 },
            { stage: "HIRED", count: 95 + offset * 2 },
        ];
        const applicantPipeline: PipelineRow[] = pipelineBase.map((row, i, arr) => {
            if (i === 0) return { ...row, conversionRate: 0 };
            const prev = arr[i - 1].count || 1;
            return {
                ...row,
                conversionRate: pct(row.count, prev), // step-to-step conversion
            };
        });

        // ===== Urgent renewals table (top 10 expiring within 30d) =====
        const now = Date.now();
        const urgentContracts: UrgentRow[] = Array.from({ length: 6 + offset }).map((_, i) => {
            const daysLeft = clamp(3 + i * 5 - offset, 1, 60);
            const endDate = new Date(now + daysLeft * 864e5).toISOString();
            const status = "PENDING_RENEWAL";
            return {
                id: `c${i + 1}`,
                facultyName: sample(["A. Santos", "J. Dela Cruz", "M. Garcia", "K. Reyes", "L. Bautista", "R. Lim", "T. Flores"], i),
                endDate,
                daysLeft,
                status,
            };
        }).slice(0, 10);

        const payload: HRPayload = {
            totalVacancies,
            activeApplications,
            pendingRenewals,
            avgTimeToFill: round1(avgTimeToFill),
            hiringTrend,
            renewalStats,
            vacancyByCollege,
            applicantPipeline,
            urgentContracts,
        };

        return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
    } catch (err) {
        console.error("HR dashboard API error:", err);
        return NextResponse.json({ error: "Failed to build HR metrics" }, { status: 500 });
    }
}

/* ================= helpers ================ */
function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}
function round1(n: number) {
    return Math.round(n * 10) / 10;
}
function pct(numer: number, denom: number) {
    if (!denom || denom <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((numer / denom) * 100)));
}
function monthLabel(date: Date) {
    return date.toLocaleString("default", { month: "short" });
}
function buildTrend(nMonths: number, min: number, max: number): TrendPoint[] {
    const out: TrendPoint[] = [];
    const d = new Date();
    for (let i = nMonths - 1; i >= 0; i--) {
        const copy = new Date(d);
        copy.setMonth(copy.getMonth() - i);
        out.push({
            month: monthLabel(copy),
            requests: randInt(min, max),
        });
    }
    return out;
}
function randInt(min: number, max: number) {
    return Math.floor(min + Math.random() * (max - min + 1));
}
function sample<T>(arr: T[], i: number) {
    return arr[i % arr.length];
}
