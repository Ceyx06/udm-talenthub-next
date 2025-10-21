// src/app/dean/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import {
    AreaChart, Area,
    LineChart, Line,
    BarChart, Bar,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

/* ========== Types ========== */
type ReqTrend = { month: string; submitted: number; approved: number; rejected: number };
type MixRow = { type: string; count: number; percentage: number };
type DeptRow = { department: string; required: number; covered: number; gap: number; utilization: number };
type RecoRow = { month: string; recommended: number; notRecommended: number; rate: number };
type ReqRow = { id: string; position: string; submittedDate: string; status: string; daysInProcess: number };

interface DeanMetrics {
    avgRequestCycleTime: number; // days
    renewalRate: number;         // %
    totalFaculty: number;
    unitCoverage: number;        // %
    requestTrend: ReqTrend[];
    facultyMix: MixRow[];
    departmentUnitLoad: DeptRow[];
    renewalRecommendations: RecoRow[];
    recentRequests: ReqRow[];
}

/* ========== Palette ========== */
const COLORS = {
    panel: "#E7F3F1",
    primary: "#0d9488",
    secondary: "#14b8a6",
    approved: "#10b981",
    rejected: "#ef4444",
    required: "#94a3b8",
};

/* ========== Demo fallback so UI renders even if API isn't ready ========== */
const FALLBACK: DeanMetrics = {
    avgRequestCycleTime: 6.8,
    renewalRate: 72,
    totalFaculty: 275,
    unitCoverage: 91,
    requestTrend: [
        { month: "May", submitted: 18, approved: 12, rejected: 2 },
        { month: "Jun", submitted: 20, approved: 14, rejected: 3 },
        { month: "Jul", submitted: 16, approved: 9, rejected: 4 },
        { month: "Aug", submitted: 19, approved: 11, rejected: 3 },
        { month: "Sep", submitted: 21, approved: 15, rejected: 4 },
        { month: "Oct", submitted: 22, approved: 13, rejected: 5 },
    ],
    facultyMix: [
        { type: "Full-Time", count: 141, percentage: 58 },
        { type: "Part-Time", count: 102, percentage: 42 },
    ],
    departmentUnitLoad: [
        { department: "Math", required: 120, covered: 110, gap: -10, utilization: 92 },
        { department: "CS", required: 150, covered: 142, gap: -8, utilization: 95 },
        { department: "Biology", required: 98, covered: 86, gap: -12, utilization: 88 },
        { department: "Psych", required: 105, covered: 105, gap: 0, utilization: 100 },
        { department: "Business", required: 160, covered: 147, gap: -13, utilization: 92 },
    ],
    renewalRecommendations: [
        { month: "Jun", recommended: 12, notRecommended: 3, rate: 80 },
        { month: "Jul", recommended: 9, notRecommended: 5, rate: 64 },
        { month: "Aug", recommended: 11, notRecommended: 3, rate: 79 },
        { month: "Sep", recommended: 15, notRecommended: 4, rate: 79 },
        { month: "Oct", recommended: 13, notRecommended: 5, rate: 72 },
    ],
    recentRequests: [
        { id: "r1", position: "Assistant Prof – CS", submittedDate: new Date(Date.now() - 7 * 864e5).toISOString(), status: "UNDER_REVIEW", daysInProcess: 7 },
        { id: "r2", position: "Lecturer – Math", submittedDate: new Date(Date.now() - 3 * 864e5).toISOString(), status: "PENDING", daysInProcess: 3 },
        { id: "r3", position: "Assoc Prof – Biology", submittedDate: new Date(Date.now() - 15 * 864e5).toISOString(), status: "APPROVED", daysInProcess: 15 },
    ],
};

export default function DeanDashboard() {
    const [semester, setSemester] = useState("2025-1");
    const [metrics, setMetrics] = useState<DeanMetrics>(FALLBACK);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState<string | null>(null);

    useEffect(() => {
        let live = true;
        (async () => {
            try {
                setLoading(true);
                setNote(null);
                const res = await fetch(`/api/dean/dashboard?semester=${semester}`, { cache: "no-store" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const payload = (await res.json()) as DeanMetrics;
                if (live) setMetrics(payload);
            } catch {
                if (live) {
                    setMetrics(FALLBACK);
                    setNote("Showing demo data (API not available).");
                }
            } finally {
                if (live) setLoading(false);
            }
        })();
        return () => { live = false; };
    }, [semester]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
            </div>
        );
    }

    /* ===== KPI behavior -> your StatCard props ===== */
    const cycleVariant: "primary" | "warning" | "danger" =
        metrics.avgRequestCycleTime <= 7 ? "primary" : metrics.avgRequestCycleTime <= 10 ? "warning" : "danger";

    const renewVariant: "success" | "warning" | "danger" =
        metrics.renewalRate >= 75 ? "success" : metrics.renewalRate >= 65 ? "warning" : "danger";

    const unitVariant: "success" | "warning" =
        metrics.unitCoverage >= 95 ? "success" : "warning";

    return (
        <div className="space-y-6 p-6">
            {/* Header + filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <PageHeader
                    title="Dean Dashboard"
                    subtitle={note ?? "Personnel stability, departmental needs, and resource utilization"}
                />
                <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-white/90 backdrop-blur border border-teal-200 text-sm focus:ring-2 focus:ring-teal-500"
                >
                    <option value="2025-1">Semester 1, 2025</option>
                    <option value="2024-2">Semester 2, 2024</option>
                    <option value="2024-1">Semester 1, 2024</option>
                </select>
            </div>

            {/* KPI Row — uses subtitle/variant/tint/icon */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    title="Avg Request Cycle (days)"
                    value={metrics.avgRequestCycleTime.toFixed(1)}
                    subtitle={cycleVariant === "danger" ? "Slow — unblock approvals" : cycleVariant === "warning" ? "Slightly elevated" : "On target"}
                    variant={cycleVariant}
                    tint="teal"
                    icon={<span>⏱️</span>}
                />
                <StatCard
                    title="Renewal Rate"
                    value={`${Math.round(metrics.renewalRate)}%`}
                    subtitle={renewVariant === "danger" ? "Low — review criteria" : renewVariant === "warning" ? "Monitor trend" : "Healthy"}
                    variant={renewVariant}
                    tint="teal"
                    icon={<span>🔁</span>}
                    trend={{ value: Math.max(-10, Math.min(10, (metrics.renewalRate - 70) / 2)), direction: metrics.renewalRate >= 70 ? "up" : "down" }}
                />
                <StatCard
                    title="Total Faculty"
                    value={metrics.totalFaculty}
                    subtitle="Active teaching staff"
                    variant="info"
                    tint="teal"
                    icon={<span>🎓</span>}
                />
                <StatCard
                    title="Unit Coverage"
                    value={`${Math.round(metrics.unitCoverage)}%`}
                    subtitle={unitVariant === "success" ? "Covered" : "Slight shortfall"}
                    variant={unitVariant}
                    tint="teal"
                    icon={<span>📘</span>}
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Request Status Trend */}
                <section className="rounded-2xl border p-4 shadow-sm" style={{ background: COLORS.panel }}>
                    <h3 className="text-base font-semibold text-slate-800 mb-2">Hiring Request Status Trend</h3>
                    <div className="h-72">
                        <ResponsiveContainer>
                            <AreaChart data={metrics.requestTrend}>
                                <defs>
                                    <linearGradient id="gSubmitted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.85} />
                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.10} />
                                    </linearGradient>
                                    <linearGradient id="gApproved" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.approved} stopOpacity={0.85} />
                                        <stop offset="95%" stopColor={COLORS.approved} stopOpacity={0.10} />
                                    </linearGradient>
                                    <linearGradient id="gRejected" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.rejected} stopOpacity={0.85} />
                                        <stop offset="95%" stopColor={COLORS.rejected} stopOpacity={0.10} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                <XAxis dataKey="month" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.96)", border: "1px solid #14b8a6", borderRadius: 8 }} />
                                <Legend />
                                <Area type="monotone" dataKey="submitted" stroke={COLORS.primary} fill="url(#gSubmitted)" />
                                <Area type="monotone" dataKey="approved" stroke={COLORS.approved} fill="url(#gApproved)" />
                                <Area type="monotone" dataKey="rejected" stroke={COLORS.rejected} fill="url(#gRejected)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Faculty Mix */}
                <section className="rounded-2xl border p-4 shadow-sm" style={{ background: COLORS.panel }}>
                    <h3 className="text-base font-semibold text-slate-800 mb-2">Faculty Roster Mix (FT vs PT)</h3>
                    <div className="h-72">
                        <ResponsiveContainer>
                            <BarChart data={metrics.facultyMix} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                <XAxis type="number" stroke="#64748b" />
                                <YAxis type="category" dataKey="type" stroke="#64748b" />
                                <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.96)", border: "1px solid #14b8a6", borderRadius: 8 }} />
                                <Legend />
                                <Bar dataKey="count" name="Faculty Count" fill={COLORS.primary} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Unit Load */}
                <section className="rounded-2xl border p-4 shadow-sm" style={{ background: COLORS.panel }}>
                    <h3 className="text-base font-semibold text-slate-800 mb-2">Unit Load Analysis by Department</h3>
                    <div className="h-72">
                        <ResponsiveContainer>
                            <BarChart data={metrics.departmentUnitLoad}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                <XAxis dataKey="department" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.96)", border: "1px solid #14b8a6", borderRadius: 8 }} />
                                <Legend />
                                <Bar dataKey="required" name="Required Units" fill={COLORS.required} />
                                <Bar dataKey="covered" name="Covered Units" fill={COLORS.primary} />
                                <Bar dataKey="gap" name="Gap" fill={COLORS.rejected} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Renewal Recommendation Trend */}
                <section className="rounded-2xl border p-4 shadow-sm" style={{ background: COLORS.panel }}>
                    <h3 className="text-base font-semibold text-slate-800 mb-2">Renewal Recommendation Rate</h3>
                    <div className="h-72">
                        <ResponsiveContainer>
                            <LineChart data={metrics.renewalRecommendations}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                <XAxis dataKey="month" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.96)", border: "1px solid #14b8a6", borderRadius: 8 }} />
                                <Legend />
                                <Line type="monotone" dataKey="recommended" stroke={COLORS.approved} strokeWidth={2} dot={{ r: 4, fill: COLORS.approved }} />
                                <Line type="monotone" dataKey="notRecommended" stroke={COLORS.rejected} strokeWidth={2} dot={{ r: 4, fill: COLORS.rejected }} />
                                <Line type="monotone" dataKey="rate" name="Rate %" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 5, fill: COLORS.primary }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>

            {/* Radar — Staffing health */}
            <section className="rounded-2xl border p-4 shadow-sm" style={{ background: COLORS.panel }}>
                <h3 className="text-base font-semibold text-slate-800 mb-2">Department Staffing Health Overview</h3>
                <div className="h-96">
                    <ResponsiveContainer>
                        <RadarChart data={metrics.departmentUnitLoad}>
                            <PolarGrid stroke="#d1d5db" />
                            <PolarAngleAxis dataKey="department" stroke="#64748b" />
                            <PolarRadiusAxis stroke="#64748b" />
                            <Radar name="Utilization %" dataKey="utilization" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.6} />
                            <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.96)", border: "1px solid #14b8a6", borderRadius: 8 }} />
                            <Legend />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Recent Requests Table */}
            <section className="rounded-2xl border p-4 shadow-sm" style={{ background: COLORS.panel }}>
                <h3 className="text-base font-semibold text-slate-800 mb-3">Recent Hiring Requests</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-teal-50">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Position</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Submitted Date</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Days in Process</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Action</th>
                            </tr>
                        </thead>
                        <tbody className="tile/70 divide-y divide-gray-200">
                            {metrics.recentRequests.map((r) => (
                                <tr key={r.id} className="hover:bg-teal-50 transition-colors">
                                    <td className="px-4 py-2 font-medium text-gray-900">{r.position}</td>
                                    <td className="px-4 py-2 text-gray-700">{new Date(r.submittedDate).toLocaleDateString()}</td>
                                    <td className="px-4 py-2">
                                        <span className={[
                                            "px-2 py-0.5 rounded-full font-semibold",
                                            r.daysInProcess <= 7 ? "bg-green-100 text-green-700"
                                                : r.daysInProcess <= 14 ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-red-100 text-red-700"
                                        ].join(" ")}>
                                            {r.daysInProcess} days
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={[
                                            "px-2 py-0.5 rounded-full text-xs font-medium",
                                            r.status === "APPROVED" ? "bg-green-100 text-green-800"
                                                : r.status === "REJECTED" ? "bg-red-100 text-red-800"
                                                    : r.status === "UNDER_REVIEW" ? "bg-blue-100 text-blue-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                        ].join(" ")}>
                                            {r.status.replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        <button className="text-teal-700 hover:text-teal-900 font-medium">
                                            View Details →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
