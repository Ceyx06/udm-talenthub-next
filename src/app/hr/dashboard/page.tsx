"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
    LineChart,
    Line,
} from "recharts";
import { Users, Clock, FileText, Calendar } from "lucide-react";

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
    label: string;
}

/* ---------------- Demo data ---------------- */
const COLORS = {
    teal: "#0d9488",
    cyan: "#06b6d4",
    amber: "#f59e0b",
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
    { stage: "APPLICATIONS", count: 420, label: "Applied" },
    { stage: "SCREENING", count: 335, label: "Screening" },
    { stage: "INTERVIEWS", count: 260, label: "Interview" },
    { stage: "OFFERS", count: 140, label: "Offer" },
    { stage: "ACCEPTED", count: 95, label: "Hired" },
];

const MOCK_PENDING = {
    toReview: 23,
    offersToApprove: 6,
    contractsToRenew: 4
};

const MOCK_FILLED = {
    month: { value: 12, target: 18 },
    quarter: { value: 33, target: 45 },
    year: { value: 92, target: 120 },
};

const MOCK_MONTHLY_TREND = [
    { month: "May", filled: 8 },
    { month: "Jun", filled: 11 },
    { month: "Jul", filled: 9 },
    { month: "Aug", filled: 14 },
    { month: "Sep", filled: 13 },
    { month: "Oct", filled: 12 },
];

/* ---------------- Simple Components ---------------- */
function BigNumber({
    label,
    value,
    icon: Icon,
    color = "teal",
    onClick
}: {
    label: string;
    value: number | string;
    icon: React.ComponentType<{ size?: number }>;
    color?: "teal" | "cyan" | "amber" | "slate";
    onClick?: () => void;
}) {
    const colors = {
        teal: "bg-teal-600 text-white",
        cyan: "bg-cyan-600 text-white",
        amber: "bg-amber-500 text-white",
        slate: "bg-slate-600 text-white",
    };

    return (
        <button
            onClick={onClick}
            className={`${colors[color]} rounded-xl p-5 text-left w-full hover:opacity-90 transition`}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">{label}</span>
                <Icon size={20} />
            </div>
            <div className="text-4xl font-bold">{value}</div>
        </button>
    );
}

function SimpleProgress({
    label,
    current,
    target
}: {
    label: string;
    current: number;
    target: number;
}) {
    const percent = Math.round((current / target) * 100);
    const isGood = percent >= 75;

    return (
        <div className="bg-white rounded-xl p-4 border">
            <div className="flex justify-between mb-2">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="text-slate-600">{current} / {target}</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${isGood ? 'bg-teal-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                />
            </div>
            <div className="text-right text-xs text-slate-500 mt-1">{percent}%</div>
        </div>
    );
}

function ChartCard({
    title,
    children
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-slate-800 mb-4">{title}</h3>
            {children}
        </div>
    );
}

/* ---------------- Page ---------------- */
export default function HRDashboard() {
    const router = useRouter();
    const [openRoles] = useState<OpenRole[]>(MOCK_OPEN_ROLES);
    const [ttfRows] = useState<TimeToFillRow[]>(MOCK_TTF);

    // Simple calculations
    const avgTTF = useMemo(() => {
        const total = ttfRows.reduce((sum, r) => sum + r.avgDays, 0);
        return Math.round(total / ttfRows.length);
    }, [ttfRows]);

    const openByDept = useMemo(() => {
        const result: { dept: DeptKey; count: number }[] = [];
        const depts: DeptKey[] = ["CAS", "CHS", "CBPM", "CCJ", "CED", "CCS"];

        depts.forEach(d => {
            const count = openRoles.filter(r => r.department === d).length;
            result.push({ dept: d, count });
        });

        return result;
    }, [openRoles]);

    const ttfByDept = useMemo(() => {
        const result: { dept: DeptKey; avgDays: number }[] = [];
        const depts: DeptKey[] = ["CAS", "CHS", "CBPM", "CCJ", "CED", "CCS"];

        depts.forEach(d => {
            const rows = ttfRows.filter(r => r.department === d);
            if (rows.length > 0) {
                const avg = rows.reduce((sum, r) => sum + r.avgDays, 0) / rows.length;
                result.push({ dept: d, avgDays: Math.round(avg) });
            } else {
                result.push({ dept: d, avgDays: 0 });
            }
        });

        return result;
    }, [ttfRows]);

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">HR Dashboard</h1>
                <p className="text-slate-600 mt-1">Overview of hiring status and progress</p>
            </div>

            {/* Top Numbers - What You Need to Know Right Now */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <BigNumber
                    label="Open Positions"
                    value={openRoles.length}
                    icon={Users}
                    color="teal"
                    onClick={() => router.push("/hr/vacancies?status=OPEN")}
                />
                <BigNumber
                    label="Need Your Review"
                    value={MOCK_PENDING.toReview}
                    icon={FileText}
                    color="cyan"
                    onClick={() => router.push("/hr/applicants")}
                />
                <BigNumber
                    label="Average Days to Fill"
                    value={`${avgTTF}d`}
                    icon={Clock}
                    color="slate"
                />
                <BigNumber
                    label="Contracts to Renew"
                    value={MOCK_PENDING.contractsToRenew}
                    icon={Calendar}
                    color="amber"
                    onClick={() => router.push("/hr/renewals")}
                />
            </div>

            {/* Your Progress */}
            <div className="bg-teal-50 rounded-xl border border-teal-100 p-5">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Your Hiring Progress</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SimpleProgress
                        label="This Month"
                        current={MOCK_FILLED.month.value}
                        target={MOCK_FILLED.month.target}
                    />
                    <SimpleProgress
                        label="This Quarter"
                        current={MOCK_FILLED.quarter.value}
                        target={MOCK_FILLED.quarter.target}
                    />
                    <SimpleProgress
                        label="This Year"
                        current={MOCK_FILLED.year.value}
                        target={MOCK_FILLED.year.target}
                    />
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hiring Funnel */}
                <ChartCard title="Hiring Funnel (How Applicants Progress)">
                    <div className="h-80">
                        <ResponsiveContainer>
                            <BarChart
                                data={MOCK_PIPELINE}
                                layout="vertical"
                                margin={{ left: 80 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis type="number" stroke="#64748b" />
                                <YAxis
                                    type="category"
                                    dataKey="label"
                                    stroke="#64748b"
                                    width={70}
                                />
                                <Tooltip />
                                <Bar
                                    dataKey="count"
                                    fill={COLORS.teal}
                                    radius={[0, 6, 6, 0]}
                                    onClick={(e) => {
                                        const stage = (e?.payload as any)?.stage;
                                        if (stage) router.push(`/hr/applicants?stage=${stage}`);
                                    }}
                                >
                                    {MOCK_PIPELINE.map((_, i) => (
                                        <Cell
                                            key={i}
                                            fill={i === 0 ? COLORS.teal : i === 4 ? "#059669" : COLORS.cyan}
                                            cursor="pointer"
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Click any bar to see applicants at that stage
                    </p>
                </ChartCard>

                {/* Monthly Trend */}
                <ChartCard title="Positions Filled Each Month">
                    <div className="h-80">
                        <ResponsiveContainer>
                            <LineChart data={MOCK_MONTHLY_TREND}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="filled"
                                    stroke={COLORS.teal}
                                    strokeWidth={3}
                                    dot={{ r: 6, fill: COLORS.teal }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Open by Department */}
                <ChartCard title="Open Positions by Department">
                    <div className="h-80">
                        <ResponsiveContainer>
                            <BarChart data={openByDept}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="dept" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip />
                                <Bar
                                    dataKey="count"
                                    fill={COLORS.teal}
                                    radius={[6, 6, 0, 0]}
                                    onClick={(e) => {
                                        const dept = (e?.payload as any)?.dept;
                                        if (dept) router.push(`/hr/vacancies?dept=${dept}`);
                                    }}
                                >
                                    {openByDept.map((_, i) => (
                                        <Cell key={i} fill={COLORS.teal} cursor="pointer" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Time to Fill */}
                <ChartCard title="Average Days to Fill by Department">
                    <div className="h-80">
                        <ResponsiveContainer>
                            <BarChart data={ttfByDept}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="dept" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip />
                                <Bar
                                    dataKey="avgDays"
                                    fill={COLORS.cyan}
                                    radius={[6, 6, 0, 0]}
                                >
                                    {ttfByDept.map((_, i) => (
                                        <Cell key={i} fill={COLORS.cyan} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Lower is better. Target: 15 days or less
                    </p>
                </ChartCard>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border p-5">
                <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                        onClick={() => router.push("/hr/applicants")}
                        className="p-4 border-2 border-teal-200 rounded-lg hover:bg-teal-50 transition text-left"
                    >
                        <div className="font-medium text-slate-800">Review Applications</div>
                        <div className="text-sm text-slate-600 mt-1">{MOCK_PENDING.toReview} waiting</div>
                    </button>
                    <button
                        onClick={() => router.push("/hr/vacancies")}
                        className="p-4 border-2 border-slate-200 rounded-lg hover:bg-slate-50 transition text-left"
                    >
                        <div className="font-medium text-slate-800">View All Vacancies</div>
                        <div className="text-sm text-slate-600 mt-1">{openRoles.length} currently open</div>
                    </button>
                    <button
                        onClick={() => router.push("/hr/analytics")}
                        className="p-4 border-2 border-cyan-200 rounded-lg hover:bg-cyan-50 transition text-left"
                    >
                        <div className="font-medium text-slate-800">View Detailed Analytics</div>
                        <div className="text-sm text-slate-600 mt-1">AI predictions & insights</div>
                    </button>
                </div>
            </div>
        </div>
    );
}