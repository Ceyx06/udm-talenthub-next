import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type DeptKey = "CAS" | "CHS" | "CBPM" | "CCJ" | "CED" | "CCS";

/* ------------ helpers ------------ */
function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function addMonths(d: Date, n: number) {
    const nd = new Date(d);
    nd.setMonth(nd.getMonth() + n);
    return nd;
}
function fmtMonth(d: Date) {
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}
function clampInt(v: number, min: number, max: number) {
    const n = Number.isFinite(+v) ? +v : min;
    return Math.max(min, Math.min(max, n));
}
function riskFromValue(v: number): "low" | "medium" | "high" {
    if (v >= 12) return "high";
    if (v >= 8) return "medium";
    return "low";
}
function bucketByMonth(dates: Date[]): Record<string, number> {
    const map: Record<string, number> = {};
    for (const dt of dates) {
        const k = fmtMonth(startOfMonth(dt));
        map[k] = (map[k] ?? 0) + 1;
    }
    return map;
}

/**
 * GET /api/hr/analytics
 * Optional query params:
 *  - horizon: 3 | 6 | 12  (default 6)
 *  - dept: CAS|CHS|CBPM|CCJ|CED|CCS (optional filter)
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const horizon = clampInt(parseInt(searchParams.get("horizon") || "6", 10), 1, 12);
        const dept = (searchParams.get("dept") || "").toUpperCase() as DeptKey | "";

        // ---------- 1) HISTORY (last 24 months of Applications) ----------
        const historyMonths = 24;
        const today = new Date();
        const historyStart = startOfMonth(addMonths(today, -historyMonths + 1));

        const applications = await prisma.application.findMany({
            where: {
                createdAt: { gte: historyStart },
                ...(dept ? { department: dept } : {}),
            },
            select: { createdAt: true },
            orderBy: { createdAt: "asc" },
        });

        // fill continuous monthly series
        const history: { month: string; actual: number; timestamp: number }[] = [];
        for (let i = historyMonths - 1; i >= 0; i--) {
            const slot = startOfMonth(addMonths(today, -i));
            history.push({
                month: fmtMonth(slot),
                actual: 0,
                timestamp: slot.getTime(),
            });
        }
        const counts = bucketByMonth(applications.map((a) => a.createdAt));
        for (const pt of history) pt.actual = counts[pt.month] ?? 0;

        // ---------- 2) FORECAST (simple seasonality + trend) ----------
        const last6 = history.slice(-6);
        const recentAvg =
            last6.length > 0 ? last6.reduce((s, m) => s + (m.actual ?? 0), 0) / last6.length : 0;

        const lastHistDate = startOfMonth(today);
        const forecast: {
            month: string;
            predicted: number;
            lower: number;
            upper: number;
            timestamp: number;
        }[] = [];
        for (let i = 1; i <= horizon; i++) {
            const futureDate = startOfMonth(addMonths(lastHistDate, i));
            const m = futureDate.getMonth();
            // Seasonality for Jan (0), Jun (5), Aug (7)
            const seasonal = m === 0 || m === 5 || m === 7 ? 4 : 0;
            const trend = 0.15 * i;
            const predicted = Math.max(0, Math.round(recentAvg + seasonal + trend));
            const lower = Math.max(0, Math.round(predicted * 0.75));
            const upper = Math.round(predicted * 1.25);

            forecast.push({
                month: fmtMonth(futureDate),
                predicted,
                lower,
                upper,
                timestamp: futureDate.getTime(),
            });
        }

        // ---------- 3) DEPARTMENT FORECAST ----------
        const openVacancies = await prisma.vacancy.findMany({
            where: { status: "OPEN", ...(dept ? { college: dept } : {}) },
            select: { college: true },
        });

        const deptList: DeptKey[] = ["CAS", "CHS", "CBPM", "CCJ", "CED", "CCS"];
        const openByDept: Record<DeptKey, number> = {
            CAS: 0,
            CHS: 0,
            CBPM: 0,
            CCJ: 0,
            CED: 0,
            CCS: 0,
        };
        for (const v of openVacancies) {
            const key = (v.college?.toUpperCase() as DeptKey) || "CAS";
            if (key in openByDept) openByDept[key] += 1;
        }

        const nextQuarterTotal = forecast.slice(0, Math.min(3, forecast.length)).reduce((s, f) => s + f.predicted, 0);
        const totalOpen = Object.values(openByDept).reduce((s, n) => s + n, 0) || 1;

        const departmentForecast = deptList
            .filter((d) => !dept || d === dept)
            .map((d) => {
                const current = openByDept[d] || 0;
                const q1 = Math.max(0, Math.round((current / totalOpen) * nextQuarterTotal));
                const q2 = Math.max(0, Math.round(q1 * 0.8 + 2));
                const growthPct =
                    current > 0 ? Math.round(((q1 - current) / current) * 100) : q1 > 0 ? 100 : 0;
                return {
                    name: d,
                    current,
                    q1,
                    q2,
                    growth: `${growthPct >= 0 ? "+" : ""}${growthPct}%`,
                    risk: riskFromValue(q1),
                };
            });

        // ---------- 4) CONTRACT EXPIRATIONS (next 6 months) ----------
        const contractsHorizon = Math.max(6, horizon);
        const contractEndFrom = startOfMonth(today);
        const contractEndTo = startOfMonth(addMonths(today, contractsHorizon));

        const renewals = await prisma.renewal.findMany({
            where: {
                contractEndDate: { gte: contractEndFrom, lt: contractEndTo },
                ...(dept ? { college: dept } : {}),
            },
            select: { contractEndDate: true, deanRecommendation: true },
            orderBy: { contractEndDate: "asc" },
        });

        // Estimate conversion to vacancies using last 12m deanRecommendation ratio
        const oneYearAgo = addMonths(today, -12);
        const recentRenewals = await prisma.renewal.findMany({
            where: {
                createdAt: { gte: oneYearAgo },
                deanRecommendation: { in: ["RENEW", "NOT_RENEW"] as any },
                ...(dept ? { college: dept } : {}),
            },
            select: { deanRecommendation: true },
        });
        let vacancyConversion = 0.6;
        if (recentRenewals.length > 4) {
            const notRenew = recentRenewals.filter((r) => r.deanRecommendation === "NOT_RENEW").length;
            vacancyConversion = notRenew / recentRenewals.length;
        }

        const contracts: { month: string; expirations: number; expectedVacancies: number }[] = [];
        for (let i = 0; i < 6; i++) {
            const slot = startOfMonth(addMonths(today, i));
            const monthKey = fmtMonth(slot);
            const expirations = renewals.filter(
                (r) => r.contractEndDate && fmtMonth(startOfMonth(r.contractEndDate)) === monthKey
            ).length;
            const expectedVacancies = Math.round(expirations * vacancyConversion);
            contracts.push({ month: monthKey, expirations, expectedVacancies });
        }

        return NextResponse.json(
            { history, forecast, departmentForecast, contracts },
            { headers: { "Cache-Control": "no-store" } }
        );
    } catch (err: any) {
        console.error("GET /api/hr/analytics error:", err);
        return NextResponse.json({ error: err?.message ?? "Failed to build analytics" }, { status: 500 });
    }
}
