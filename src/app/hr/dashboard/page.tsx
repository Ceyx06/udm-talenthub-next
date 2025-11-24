// src/app/hr/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
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

type DashboardMetrics = {
    openByDept: Array<{ dept: DeptKey | string; open: number; avgDaysOpen: number }>;
    pipeline: Array<{
        stage: "APPLICATIONS" | "SCREENING" | "INTERVIEWS" | "OFFERS" | "ACCEPTED";
        count: number;
    }>;
    pending: PendingActionCounts;
    ttfByDept: Array<{ dept: DeptKey | string; avgDays: number }>;
    filled: {
        month: { value: number; target: number };
        quarter: { value: number; target: number };
        year: { value: number; target: number };
    };
};

/* ---------------- UI helpers ---------------- */
const COLORS = {
    tealA: "#0d9488",
    tealB: "#10b981",
    tealC: "#2dd4bf",
    amber: "#f59e0b",
    red: "#ef4444",
    cyan: "#06b6d4",
};

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
    const pct = Math.min(100, Math.round((value / Math.max(target, 1)) * 100));
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

    // Live metrics
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // 🔔 Vacancy Requests (from Deans)
    const [pendingRequests, setPendingRequests] = useState<number>(0);

    // Fetch HR dashboard metrics
    useEffect(() => {
        let alive = true;
        const load = async () => {
            try {
                setErr(null);
                setLoading(true);
                const res = await fetch("/api/hr/dashboard", { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to load dashboard metrics");
                const json: DashboardMetrics = await res.json();
                if (alive) setMetrics(json);
            } catch (e: any) {
                if (alive) {
                    setMetrics(null);
                    setErr(e?.message || "Failed to load dashboard metrics");
                }
            } finally {
                if (alive) setLoading(false);
            }
        };
        load();
        const id = setInterval(load, 30_000); // optional polling every 30s
        return () => {
            alive = false;
            clearInterval(id);
        };
    }, []);

    // Fetch & poll vacancy requests (your existing logic)
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
        const id = setInterval(load, 30_000);
        return () => {
            alive = false;
            clearInterval(id);
        };
    }, []);

    // Derived safely from metrics
    const openByDept = metrics?.openByDept ?? [];
    const ttfByDept = metrics?.ttfByDept ?? [];
    const pipeline = metrics?.pipeline ?? [];
    const pending = metrics?.pending ?? { toReview: 0, offersToApprove: 0, contractsToRenew: 0 };
    const FILLED =
        metrics?.filled ?? { month: { value: 0, target: 1 }, quarter: { value: 0, target: 1 }, year: { value: 0, target: 1 } };

    // chart colors
    const cellColor = (i: number) =>
        [COLORS.tealA, COLORS.tealB, COLORS.tealC, COLORS.cyan, COLORS.amber, COLORS.red][i % 6];

    // Navigate helpers
    const gotoApplicants = (stage: DashboardMetrics["pipeline"][number]["stage"]) =>
        router.push(`/hr/applicants?stage=${encodeURIComponent(stage)}`);
    const gotoOpenVacancies = (dept: DeptKey | string) =>
        router.push(`/hr/vacancies?status=OPEN&dept=${encodeURIComponent(String(dept))}`);
    const gotoTTFAnalytics = (dept: DeptKey | string) =>
        router.push(`/hr/analytics/ttf?dept=${encodeURIComponent(String(dept))}`);

    if (loading && !metrics) {
        return (
            <div className="p-6 space-y-6">
                <PageHeader title="HR Dashboard" subtitle="Efficiency, workload, and performance tracking of the hiring process" />
                <div className="rounded-xl border bg-white p-12 text-center">
                    <p className="text-gray-500">Loading dashboard metrics…</p>
                </div>
            </div>
        );
    }

    if (err) {
        return (
            <div className="p-6 space-y-6">
                <PageHeader title="HR Dashboard" subtitle="Efficiency, workload, and performance tracking of the hiring process" />
                <div className="rounded-xl border bg-white p-12 text-center">
                    <p className="text-red-600 mb-4">Error: {err}</p>
                    <button
                        onClick={() => {
                            setLoading(true);
                            setErr(null);
                            // simple refetch
                            fetch("/api/hr/dashboard", { cache: "no-store" })
                                .then((r) => r.json())
                                .then((j) => setMetrics(j))
                                .catch((e) => setErr(e?.message || "Failed to load dashboard metrics"))
                                .finally(() => setLoading(false));
                        }}
                        className="rounded-md bg-blue-900 text-white px-4 py-2 hover:bg-blue-800"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

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

            {/* --- KPI tiles --- */}
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
                    <Progress label="Positions Filled — This Month" value={FILLED.month.value} target={FILLED.month.target} />
                    <Progress label="Positions Filled — This Quarter" value={FILLED.quarter.value} target={FILLED.quarter.target} />
                    <Progress label="Positions Filled — This Year" value={FILLED.year.value} target={FILLED.year.target} />
                </div>

                {/* Expanded across 2 columns */}
                <div className="lg:col-span-2">
                    <Panel title="Hiring Pipeline Status" subtitle="Funnel from Applications → Accepted (click a bar to open Applicants)">
                        <div className="h-80">
                            <ResponsiveContainer>
                                <BarChart data={pipeline} barCategoryGap={20} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
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
                                        {pipeline.map((_, i) => (
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
