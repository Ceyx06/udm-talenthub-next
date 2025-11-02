// src/app/hr/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from "recharts";

/* ---------------- Types ---------------- */
type DeptKey = "CAS" | "CHS" | "CBPM" | "CCJ" | "CED" | "CCS";

interface OpenRole {
    id: string;
    title: string;
    department: DeptKey;
    daysOpen: number;
    postedDate: string;
}

interface TimeToFillRow {
    department: DeptKey;
    positionType: "Full-time" | "Part-time" | "Lecturer";
    avgDays: number;
}

interface PipelineStage {
    stage: "APPLICATIONS" | "SCREENING" | "INTERVIEWS" | "OFFERS" | "ACCEPTED";
    count: number;
}

interface PendingActionCounts {
    toReview: number;
    offersToApprove: number;
    contractsToRenew: number;
}

type VacancyRequest = {
    id: string;
    title: string;
    college: DeptKey | string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "DRAFT";
    createdAt: string;
};

/* ---------------- Demo data ---------------- */
const COLORS = {
    tealA: "#0d9488",
    tealB: "#10b981",
    tealC: "#2dd4bf",
    amber: "#f59e0b",
    red: "#ef4444",
    cyan: "#06b6d4",
};

const MOCK_OPEN_ROLES: OpenRole[] = [
    { id: "v1", title: "Assistant Prof — Math", department: "CAS", daysOpen: 21, postedDate: "2025-09-30" },
    { id: "v2", title: "Lecturer — Biology", department: "CAS", daysOpen: 13, postedDate: "2025-10-08" },
    { id: "v3", title: "Instructor — Nursing", department: "CHS", daysOpen: 28, postedDate: "2025-09-23" },
    { id: "v4", title: "Associate Prof — Business", department: "CBPM", daysOpen: 7, postedDate: "2025-10-14" },
    { id: "v5", title: "Criminology Lecturer", department: "CCJ", daysOpen: 18, postedDate: "2025-10-03" },
    { id: "v6", title: "Education Instructor", department: "CED", daysOpen: 9, postedDate: "2025-10-12" },
    { id: "v7", title: "CompSci Lecturer", department: "CCS", daysOpen: 31, postedDate: "2025-09-20" },
];

const MOCK_TTF: TimeToFillRow[] = [
    { department: "CAS", positionType: "Full-time", avgDays: 18 },
    { department: "CAS", positionType: "Lecturer", avgDays: 12 },
    { department: "CHS", positionType: "Full-time", avgDays: 19 },
    { department: "CBPM", positionType: "Full-time", avgDays: 16 },
    { department: "CCJ", positionType: "Lecturer", avgDays: 14 },
    { department: "CED", positionType: "Part-time", avgDays: 10 },
    { department: "CCS", positionType: "Lecturer", avgDays: 13 },
];

const MOCK_PIPELINE: PipelineStage[] = [
    { stage: "APPLICATIONS", count: 420 },
    { stage: "SCREENING", count: 335 },
    { stage: "INTERVIEWS", count: 260 },
    { stage: "OFFERS", count: 140 },
    { stage: "ACCEPTED", count: 95 },
];

const MOCK_PENDING: PendingActionCounts = { toReview: 23, offersToApprove: 6, contractsToRenew: 4 };

const MOCK_FILLED = {
    month: { value: 12, target: 18 },
    quarter: { value: 33, target: 45 },
    year: { value: 92, target: 120 },
};

/* ---------------- Tiny components ---------------- */
function Panel({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border bg-[#E7F3F1] p-4 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
            {subtitle && <p className="text-[11px] text-gray-600 mb-2">{subtitle}</p>}
            {children}
        </section>
    );
}

function Progress({ value, target, label }: { value: number; target: number; label: string }) {
    const pct = Math.min(100, Math.round((value / target) * 100));
    return (
        <div className="rounded-2xl border bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-semibold text-slate-700">{label}</span>
                <span className="text-slate-500">
                    {value}/{target}
                </span>
            </div>
            <div className="h-2 w-full rounded-full bg-teal-100 overflow-hidden">
                <div style={{ width: `${pct}%` }} className="h-full bg-teal-600" />
            </div>
        </div>
    );
}

/** KPI-style stat tile */
function StatTile({
    title,
    value,
    subtitle,
    tone = "teal",
    onClick,
}: {
    title: string;
    value: number | string;
    subtitle?: string;
    tone?: "teal" | "mint" | "sand" | "sky";
    onClick?: () => void;
}) {
    const tones: Record<string, { container: string; icon: string }> = {
        teal: { container: "bg-teal-600 text-white", icon: "bg-white/25 text-white" },
        mint: { container: "bg-teal-50 text-slate-900 border border-teal-100", icon: "bg-teal-100 text-teal-700" },
        sand: { container: "bg-amber-50 text-slate-900 border border-amber-100", icon: "bg-amber-100 text-amber-700" },
        sky: { container: "bg-cyan-50 text-slate-900 border border-cyan-100", icon: "bg-cyan-100 text-cyan-700" },
    };

    const t = tones[tone];

    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "rounded-2xl w-full p-4 shadow-sm border transition text-left",
                "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500",
                t.container,
            ].join(" ")}
        >
            <div className="flex items-start justify-between">
                <div className="text-[11px] font-medium opacity-90">{title}</div>
                <span className={["inline-flex items-center justify-center rounded-lg p-1.5", t.icon].join(" ")}>
                    <span className="text-[11px]">▣</span>
                </span>
            </div>
            <div className="mt-1 text-3xl font-extrabold tracking-tight">{value}</div>
            {subtitle && <div className="mt-1 text-[11px] opacity-90">{subtitle}</div>}
        </button>
    );
}

/* ---------------- Page ---------------- */
export default function HRDashboard() {
    const router = useRouter();

    // Mock data (swap for API when ready)
    const [openRoles] = useState<OpenRole[]>(MOCK_OPEN_ROLES);
    const [ttfRows] = useState<TimeToFillRow[]>(MOCK_TTF);
    const [pending] = useState<PendingActionCounts>(MOCK_PENDING);

    // 🔔 Vacancy Requests (from Deans)
    const [pendingRequests, setPendingRequests] = useState<number>(0);

    // Fetch & poll vacancy requests
    useEffect(() => {
        let alive = true;
        const load = async () => {
            try {
                const res = await fetch("/api/dean/vacancy-request", { cache: "no-store" });
                const text = await res.text();
                let json: any = {};
                try {
                    json = text ? JSON.parse(text) : {};
                } catch {
                    json = {};
                }
                const list: VacancyRequest[] = json?.data ?? [];
                const count = Array.isArray(list) ? list.filter((r) => r?.status === "PENDING").length : 0;
                if (alive) setPendingRequests(count);
            } catch {
                if (alive) setPendingRequests(0);
            }
        };

        load();
        const id = setInterval(load, 30_000); // every 30s
        return () => {
            alive = false;
            clearInterval(id);
        };
    }, []);

    // Aggregations
    const openByDept = useMemo(() => {
        const byDept: Record<DeptKey, { dept: DeptKey; open: number; avgDaysOpen: number }> = {
            CAS: { dept: "CAS", open: 0, avgDaysOpen: 0 },
            CHS: { dept: "CHS", open: 0, avgDaysOpen: 0 },
            CBPM: { dept: "CBPM", open: 0, avgDaysOpen: 0 },
            CCJ: { dept: "CCJ", open: 0, avgDaysOpen: 0 },
            CED: { dept: "CED", open: 0, avgDaysOpen: 0 },
            CCS: { dept: "CCS", open: 0, avgDaysOpen: 0 },
        };
        for (const r of openRoles) {
            byDept[r.department].open++;
            byDept[r.department].avgDaysOpen += r.daysOpen;
        }
        (Object.keys(byDept) as DeptKey[]).forEach((d) => {
            if (byDept[d].open > 0) byDept[d].avgDaysOpen = +(byDept[d].avgDaysOpen / byDept[d].open).toFixed(1);
        });
        return Object.values(byDept);
    }, [openRoles]);

    const ttfByDept = useMemo(() => {
        const map: Record<DeptKey, { dept: DeptKey; avgDays: number; items: TimeToFillRow[] }> = {
            CAS: { dept: "CAS", avgDays: 0, items: [] },
            CHS: { dept: "CHS", avgDays: 0, items: [] },
            CBPM: { dept: "CBPM", avgDays: 0, items: [] },
            CCJ: { dept: "CCJ", avgDays: 0, items: [] },
            CED: { dept: "CED", avgDays: 0, items: [] },
            CCS: { dept: "CCS", avgDays: 0, items: [] },
        };
        for (const row of ttfRows) {
            map[row.department].items.push(row);
            map[row.department].avgDays += row.avgDays;
        }
        (Object.keys(map) as DeptKey[]).forEach((d) => {
            if (map[d].items.length) map[d].avgDays = +(map[d].avgDays / map[d].items.length).toFixed(1);
        });
        return Object.values(map);
    }, [ttfRows]);

    // chart colors
    const cellColor = (i: number) =>
        [COLORS.tealA, COLORS.tealB, COLORS.tealC, COLORS.cyan, COLORS.amber, COLORS.red][i % 6];

    // Navigate helpers
    const gotoApplicants = (stage: PipelineStage["stage"]) =>
        router.push(`/hr/applicants?stage=${encodeURIComponent(stage)}`);
    const gotoOpenVacancies = (dept: DeptKey) =>
        router.push(`/hr/vacancies?status=OPEN&dept=${encodeURIComponent(dept)}`);
    const gotoTTFAnalytics = (dept: DeptKey) =>
        router.push(`/hr/analytics/ttf?dept=${encodeURIComponent(dept)}`);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <PageHeader
                    title="HR Dashboard"
                    subtitle="Efficiency, workload, and performance tracking of the hiring process"
                />
            </div>

            {/* 🔔 Info bar when there are pending requests */}
            {pendingRequests > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {pendingRequests} new vacancy {pendingRequests === 1 ? "request" : "requests"} awaiting HR review.
                    <button
                        onClick={() => router.push("/hr/vacancies?status=DRAFT")}
                        className="ml-3 inline-flex rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-medium hover:bg-amber-100"
                    >
                        Open in Vacancies
                    </button>
                </div>
            )}

            {/* --- KPI tiles (Vacancy Requests moved beside Contracts) --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile
                    title="Applications to Review"
                    value={pending.toReview}
                    subtitle="Awaiting screening"
                    tone="teal"
                    onClick={() => router.push("/hr/applicants?stage=APPLICATIONS")}
                />
                <StatTile
                    title="Offers to Approve"
                    value={pending.offersToApprove}
                    subtitle="Pending approvals"
                    tone="sky"
                    onClick={() => router.push("/hr/applicants?stage=OFFERS")}
                />
                <StatTile
                    title="Contracts to Renew"
                    value={pending.contractsToRenew}
                    subtitle="Monitor queue"
                    tone="sand"
                    onClick={() => router.push("/hr/renewals")}
                />
                {/* Vacancy Requests tile → Vacancies page filtered to DRAFT */}
                <StatTile
                    title="Vacancy Requests"
                    value={pendingRequests}
                    subtitle="From Deans (Pending)"
                    tone="mint"
                    onClick={() => router.push("/hr/vacancies?status=DRAFT")}
                />
            </div>

            {/* Row: Progress + Expanded Pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="grid grid-cols-1 gap-3">
                    <Progress label="Positions Filled — This Month" value={MOCK_FILLED.month.value} target={MOCK_FILLED.month.target} />
                    <Progress label="Positions Filled — This Quarter" value={MOCK_FILLED.quarter.value} target={MOCK_FILLED.quarter.target} />
                    <Progress label="Positions Filled — This Year" value={MOCK_FILLED.year.value} target={MOCK_FILLED.year.target} />
                </div>

                {/* Expanded across 2 columns */}
                <div className="lg:col-span-2">
                    <Panel title="Hiring Pipeline Status" subtitle="Funnel from Applications → Accepted (click a bar to open Applicants)">
                        <div className="h-80">
                            <ResponsiveContainer>
                                <BarChart data={MOCK_PIPELINE} barCategoryGap={20} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                    <XAxis dataKey="stage" stroke="#64748b" interval={0} tick={{ fontSize: 12 }} height={40} tickMargin={8} />
                                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar
                                        dataKey="count"
                                        name="Count"
                                        radius={[6, 6, 0, 0]}
                                        onClick={(e) => gotoApplicants((e?.payload as any)?.stage)}
                                    >
                                        {MOCK_PIPELINE.map((_, i) => (
                                            <Cell key={i} cursor="pointer" fill={cellColor(i)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Panel>
                </div>
            </div>

            {/* Row: Current Open Positions + Time to Fill */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Current Open Positions" subtitle="Number open by department & average days open (click a bar)">
                    <div className="h-72">
                        <ResponsiveContainer>
                            <BarChart data={openByDept}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                <XAxis dataKey="dept" stroke="#64748b" />
                                <YAxis yAxisId="left" stroke="#64748b" />
                                <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    yAxisId="left"
                                    dataKey="open"
                                    name="Open Roles"
                                    radius={[6, 6, 0, 0]}
                                    onClick={(e) => gotoOpenVacancies((e?.payload as any)?.dept)}
                                >
                                    {openByDept.map((_, i) => (
                                        <Cell key={i} cursor="pointer" fill={COLORS.tealA} />
                                    ))}
                                </Bar>
                                <Bar
                                    yAxisId="right"
                                    dataKey="avgDaysOpen"
                                    name="Avg Days Open"
                                    radius={[6, 6, 0, 0]}
                                    onClick={(e) => gotoOpenVacancies((e?.payload as any)?.dept)}
                                >
                                    {openByDept.map((_, i) => (
                                        <Cell key={i} cursor="pointer" fill={COLORS.amber} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>

                <Panel title="Time to Fill" subtitle="Average days to fill by department (click a bar)">
                    <div className="h-72">
                        <ResponsiveContainer>
                            <BarChart data={ttfByDept}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                <XAxis dataKey="dept" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey="avgDays"
                                    name="Avg Days to Fill"
                                    radius={[6, 6, 0, 0]}
                                    onClick={(e) => gotoTTFAnalytics((e?.payload as any)?.dept)}
                                >
                                    {ttfByDept.map((_, i) => (
                                        <Cell key={i} cursor="pointer" fill={COLORS.tealB} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>
            </div>
        </div>
    );
}
