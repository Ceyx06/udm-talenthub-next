// src/app/hr/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import {
    LineChart, Line,
    BarChart, Bar,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

type TrendPoint = { month: string; requests: number };
type RenewalSlice = { status: string; count: number; percentage: number };
type CollegeRow = { college: string; open: number; filled: number; avgDays: number };
type PipelineRow = { stage: string; count: number; conversionRate: number };
type UrgentRow = { id: string; facultyName: string; endDate: string; daysLeft: number; status: string };

interface DashboardMetrics {
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

/** Brand palette (teal glass look) */
const C = {
    panel: "#E7F3F1",
    line: "#0d9488",
    barA: "#0d9488",
    barB: "#10b981",
    barC: "#2dd4bf",
    renew: "#10b981",
    not: "#ef4444",
    pend: "#f59e0b",
};

/** KPI thresholds */
const PENDING_WARN = 8;
const PENDING_DANGER = 15;
const TTF_WARN = 14;
const TTF_DANGER = 18;

/** Demo fallback so UI renders even if API isn’t live */
const FALLBACK: DashboardMetrics = {
    totalVacancies: 37,
    activeApplications: 182,
    pendingRenewals: 12,
    avgTimeToFill: 15.6,
    hiringTrend: [
        { month: "Nov", requests: 9 }, { month: "Dec", requests: 11 },
        { month: "Jan", requests: 13 }, { month: "Feb", requests: 14 },
        { month: "Mar", requests: 16 }, { month: "Apr", requests: 18 },
        { month: "May", requests: 17 }, { month: "Jun", requests: 19 },
        { month: "Jul", requests: 21 }, { month: "Aug", requests: 20 },
        { month: "Sep", requests: 22 }, { month: "Oct", requests: 24 },
    ],
    renewalStats: [
        { status: "Renewed", count: 44, percentage: 64 },
        { status: "Not Renewed", count: 18, percentage: 26 },
        { status: "Pending", count: 7, percentage: 10 },
    ],
    vacancyByCollege: [
        { college: "CAS", open: 6, filled: 12, avgDays: 16.1 },
        { college: "CHS", open: 4, filled: 9, avgDays: 17.2 },
        { college: "CBPM", open: 3, filled: 8, avgDays: 15.3 },
        { college: "CCJ", open: 2, filled: 7, avgDays: 14.7 },
        { college: "CED", open: 5, filled: 6, avgDays: 13.9 },
        { college: "CCS", open: 4, filled: 5, avgDays: 12.8 },
    ],
    applicantPipeline: [
        { stage: "SUBMITTED", count: 420, conversionRate: 0 },
        { stage: "SCREENING", count: 335, conversionRate: 80 },
        { stage: "INTERVIEW", count: 260, conversionRate: 78 },
        { stage: "EVALUATION", count: 190, conversionRate: 73 },
        { stage: "OFFER", count: 140, conversionRate: 74 },
        { stage: "HIRED", count: 95, conversionRate: 68 },
    ],
    urgentContracts: [],
};

export default function HRDashboard() {
    const [data, setData] = useState<DashboardMetrics>(FALLBACK);
    const [range, setRange] = useState("30");
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState<string | null>(null);

    useEffect(() => {
        let live = true;
        (async () => {
            try {
                setLoading(true);
                setNote(null);
                const res = await fetch(`/api/hr/dashboard?range=${range}`, { cache: "no-store" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const payload = (await res.json()) as DashboardMetrics;
                if (live) setData(payload);
            } catch {
                if (live) {
                    setData(FALLBACK);
                    setNote("Showing demo data (API not available).");
                }
            } finally {
                if (live) setLoading(false);
            }
        })();
        return () => { live = false; };
    }, [range]);

    const pendingVariant: "success" | "warning" | "danger" =
        data.pendingRenewals >= PENDING_DANGER ? "danger" :
            data.pendingRenewals >= PENDING_WARN ? "warning" : "success";

    const ttfVariant: "success" | "warning" | "danger" =
        data.avgTimeToFill > TTF_DANGER ? "danger" :
            data.avgTimeToFill > TTF_WARN ? "warning" : "success";

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header + filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <PageHeader
                    title="HR Dashboard"
                    subtitle={note ?? "Efficiency, workload, and performance tracking of the hiring process"}
                />
                <select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-white/90 backdrop-blur border border-teal-200 text-sm focus:ring-2 focus:ring-teal-500"
                >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                </select>
            </div>

            {/* KPI tiles — use StatCard (subtitle/variant/tint/icon) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Requests (12 mo)"
                    value={data.hiringTrend.reduce((s, d) => s + d.requests, 0)}
                    subtitle="All vacancy requests in the last year"
                    variant="primary"
                    tint="teal"
                    icon={<span>📁</span>}
                />
                <StatCard
                    title="Active Vacancies"
                    value={data.totalVacancies}
                    subtitle="Currently posted & open"
                    variant="info"
                    tint="teal"
                    icon={<span>📄</span>}
                />
                <StatCard
                    title="Pending Renewals"
                    value={data.pendingRenewals}
                    subtitle={
                        pendingVariant === "danger" ? "High backlog" :
                            pendingVariant === "warning" ? "Monitor queue" : "Healthy"
                    }
                    variant={pendingVariant}
                    tint="teal"
                    icon={<span>👥</span>}
                />
                <StatCard
                    title="Avg Time-to-Fill (days)"
                    value={data.avgTimeToFill.toFixed(1)}
                    subtitle={
                        ttfVariant === "danger" ? "Slow — investigate" :
                            ttfVariant === "warning" ? "Slightly elevated" : "On target"
                    }
                    variant={ttfVariant}
                    tint="teal"
                    icon={<span>⏱️</span>}
                />
            </div>

            {/* Charts row 1 — Line + Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="rounded-2xl border bg-[#E7F3F1] p-4 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-800 mb-2">New Hiring Requests</h3>
                    <p className="text-[11px] text-gray-600 mb-2">Request Volume Trend (last 12 months)</p>
                    <div className="h-72">
                        <ResponsiveContainer>
                            <LineChart data={data.hiringTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                <XAxis dataKey="month" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.96)", border: "1px solid #14b8a6", borderRadius: 8 }} />
                                <Legend />
                                <Line type="monotone" dataKey="requests" stroke={C.line} strokeWidth={3} dot={{ r: 4, fill: C.line }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className="rounded-2xl border bg-[#E7F3F1] p-4 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-800 mb-2">Urgent Contract Renewals</h3>
                    <p className="text-[11px] text-gray-600 mb-2">Renewal Load & Compliance</p>
                    <div className="h-72">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={data.renewalStats}
                                    dataKey="count"
                                    nameKey="status"
                                    innerRadius={"55%"}
                                    outerRadius={"80%"}
                                    stroke="#fff"
                                    strokeWidth={1}
                                    label={({ status, percentage }) => `${status}: ${percentage}%`}
                                >
                                    {data.renewalStats.map((s, i) => (
                                        <Cell
                                            key={i}
                                            fill={
                                                s.status === "Renewed" ? C.renew :
                                                    s.status === "Not Renewed" ? C.not : C.pend
                                            }
                                        />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.96)", border: "1px solid #14b8a6", borderRadius: 8 }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>

            {/* Charts row 2 — Bars + Pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="rounded-2xl border bg-[#E7F3F1] p-4 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-800 mb-2">Active Vacancies</h3>
                    <p className="text-[11px] text-gray-600 mb-2">Open vs Filled by College</p>
                    <div className="h-72">
                        <ResponsiveContainer>
                            <BarChart data={data.vacancyByCollege}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                <XAxis dataKey="college" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.96)", border: "1px solid #14b8a6", borderRadius: 8 }} />
                                <Legend />
                                <Bar dataKey="open" name="Open" fill={C.barA} />
                                <Bar dataKey="filled" name="Filled" fill={C.barB} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className="rounded-2xl border bg-[#E7F3F1] p-4 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-800 mb-2">Applicant Pipeline</h3>
                    <p className="text-[11px] text-gray-600 mb-2">Volume & step-to-step conversion</p>
                    <div className="h-72">
                        <ResponsiveContainer>
                            <BarChart data={data.applicantPipeline}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                <XAxis dataKey="stage" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.96)", border: "1px solid #14b8a6", borderRadius: 8 }} />
                                <Legend />
                                <Bar dataKey="count" name="Applicants" fill={C.barC} />
                                <Bar dataKey="conversionRate" name="Conversion %" fill={C.barB} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>
        </div>
    );
}
