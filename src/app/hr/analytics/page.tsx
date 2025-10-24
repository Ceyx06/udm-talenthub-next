"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    LineChart, Line,
    BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell,
} from "recharts";
import { Zap, Target, TrendingUp, AlertCircle } from "lucide-react";

/* ========== Types ========== */
type DeptKey = "All" | "CAS" | "CHS" | "CBPM" | "CCJ" | "CED" | "CCS";

type TTFPoint = { month: string; days: number };
type DeptPerf = { dept: string; avgDays: number };
type ProcessStep = { step: string; avgDays: number; status: "good" | "warning" | "critical" };
type Prediction = { position: string; predictedDays: number; confidence: number };

/* ========== Mock Data ========== */
const DEPTS = ["CAS", "CHS", "CBPM", "CCJ", "CED", "CCS"];

const TTF_TREND: TTFPoint[] = [
    { month: "May", days: 17 },
    { month: "Jun", days: 16 },
    { month: "Jul", days: 18 },
    { month: "Aug", days: 15 },
    { month: "Sep", days: 16 },
    { month: "Oct", days: 14 },
];

const DEPT_PERFORMANCE: DeptPerf[] = [
    { dept: "CAS", avgDays: 16 },
    { dept: "CHS", avgDays: 18 },
    { dept: "CBPM", avgDays: 15 },
    { dept: "CCJ", avgDays: 14 },
    { dept: "CED", avgDays: 12 },
    { dept: "CCS", avgDays: 13 },
];

const PROCESS_STEPS: ProcessStep[] = [
    { step: "Post → Screen", avgDays: 3, status: "good" },
    { step: "Screen → Interview", avgDays: 9, status: "warning" },
    { step: "Interview → Evaluation", avgDays: 5, status: "good" },
    { step: "Evaluation → Offer", avgDays: 12, status: "critical" },
    { step: "Offer → Accept", avgDays: 5, status: "good" },
];

const AI_PREDICTIONS: Prediction[] = [
    { position: "CAS - Assistant Prof", predictedDays: 18, confidence: 87 },
    { position: "CHS - Lecturer", predictedDays: 14, confidence: 92 },
    { position: "CED - Associate Prof", predictedDays: 22, confidence: 79 },
];

const COLORS = {
    teal: "#0d9488",
    cyan: "#06b6d4",
    amber: "#f59e0b",
    red: "#ef4444",
    green: "#22c55e",
};

/* ========== Simple Components ========== */
function BigStat({
    label,
    value,
    color = "teal"
}: {
    label: string;
    value: string | number;
    color?: "teal" | "cyan" | "amber";
}) {
    const colors = {
        teal: "bg-teal-600",
        cyan: "bg-cyan-600",
        amber: "bg-amber-500",
    };

    return (
        <div className={`${colors[color]} text-white rounded-xl p-5`}>
            <div className="text-sm opacity-90 mb-2">{label}</div>
            <div className="text-4xl font-bold">{value}</div>
        </div>
    );
}

function Card({
    title,
    subtitle,
    children
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-xl border p-5">
            <div className="mb-4">
                <h3 className="font-semibold text-slate-800">{title}</h3>
                {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}

function InfoBox({
    type,
    title,
    message
}: {
    type: "info" | "tip" | "warning";
    title: string;
    message: string;
}) {
    const styles = {
        info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900" },
        tip: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-900" },
        warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900" },
    };
    const s = styles[type];

    return (
        <div className={`${s.bg} border ${s.border} rounded-xl p-4`}>
            <div className={`font-semibold text-sm ${s.text}`}>{title}</div>
            <div className={`text-xs ${s.text} mt-1 opacity-90`}>{message}</div>
        </div>
    );
}

/* ========== Page ========== */
export default function HRAnalytics() {
    const router = useRouter();
    const [dept, setDept] = useState<DeptKey>("All");
    const [view, setView] = useState<"overview" | "predictions" | "process">("overview");

    const avgTTF = useMemo(() => {
        const total = TTF_TREND.reduce((sum, d) => sum + d.days, 0);
        return Math.round(total / TTF_TREND.length);
    }, []);

    const criticalSteps = useMemo(() => {
        return PROCESS_STEPS.filter(s => s.status === "critical").length;
    }, []);

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">HR Analytics</h1>
                    <p className="text-slate-600 mt-1">Insights to improve your hiring process</p>
                </div>
                <button
                    onClick={() => router.push("/hr/dashboard")}
                    className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-slate-50"
                >
                    ← Back to Dashboard
                </button>
            </div>

            {/* View Tabs */}
            <div className="flex gap-2 bg-white rounded-xl p-1 border w-fit">
                <button
                    onClick={() => setView("overview")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === "overview"
                            ? "bg-teal-600 text-white"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                >
                    <TrendingUp size={16} className="inline mr-2" />
                    Overview
                </button>
                <button
                    onClick={() => setView("predictions")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === "predictions"
                            ? "bg-teal-600 text-white"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                >
                    <Zap size={16} className="inline mr-2" />
                    AI Predictions
                </button>
                <button
                    onClick={() => setView("process")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === "process"
                            ? "bg-teal-600 text-white"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                >
                    <Target size={16} className="inline mr-2" />
                    Process Analysis
                </button>
            </div>

            {/* OVERVIEW TAB */}
            {view === "overview" && (
                <>
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <BigStat label="Average Time to Fill" value={`${avgTTF} days`} color="teal" />
                        <BigStat label="Fastest Department" value="CED (12d)" color="cyan" />
                        <BigStat label="Improvement This Month" value="↓ 2 days" color="teal" />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card
                            title="Time to Fill Trend"
                            subtitle="How long it takes to fill positions over time"
                        >
                            <div className="h-72">
                                <ResponsiveContainer>
                                    <LineChart data={TTF_TREND}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="month" stroke="#64748b" />
                                        <YAxis stroke="#64748b" />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="days"
                                            stroke={COLORS.teal}
                                            strokeWidth={3}
                                            dot={{ r: 5, fill: COLORS.teal }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-xs text-slate-500 mt-3">
                                ✓ Good news: You're getting faster at hiring
                            </p>
                        </Card>

                        <Card
                            title="Department Comparison"
                            subtitle="Average days to fill by department"
                        >
                            <div className="h-72">
                                <ResponsiveContainer>
                                    <BarChart data={DEPT_PERFORMANCE}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="dept" stroke="#64748b" />
                                        <YAxis stroke="#64748b" />
                                        <Tooltip />
                                        <Bar dataKey="avgDays" fill={COLORS.teal} radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-xs text-slate-500 mt-3">
                                Lower is better. Target: 15 days or less
                            </p>
                        </Card>
                    </div>
                </>
            )}

            {/* AI PREDICTIONS TAB */}
            {view === "predictions" && (
                <>
                    <InfoBox
                        type="info"
                        title="How AI Predictions Work"
                        message="Our system analyzes past hiring data to predict how long new positions will take to fill. Higher confidence = more accurate prediction."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {AI_PREDICTIONS.map((pred, i) => (
                            <div key={i} className="bg-white rounded-xl border p-5">
                                <div className="text-sm text-slate-600 mb-2">{pred.position}</div>
                                <div className="text-3xl font-bold text-teal-600 mb-3">
                                    {pred.predictedDays} days
                                </div>
                                <div className="text-xs text-slate-500 mb-2">Confidence</div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-teal-500"
                                            style={{ width: `${pred.confidence}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">
                                        {pred.confidence}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Card title="What This Means for You">
                        <div className="space-y-3">
                            <div className="flex gap-3 p-3 bg-teal-50 rounded-lg">
                                <div className="text-2xl">📅</div>
                                <div>
                                    <div className="font-medium text-slate-800 text-sm">Plan Ahead</div>
                                    <div className="text-xs text-slate-600 mt-1">
                                        If you need a position filled by a certain date, post it {avgTTF + 5} days before
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 p-3 bg-cyan-50 rounded-lg">
                                <div className="text-2xl">⚡</div>
                                <div>
                                    <div className="font-medium text-slate-800 text-sm">Set Realistic Expectations</div>
                                    <div className="text-xs text-slate-600 mt-1">
                                        Senior positions typically take 20-25 days, lecturer positions 12-15 days
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </>
            )}

            {/* PROCESS ANALYSIS TAB */}
            {view === "process" && (
                <>
                    <InfoBox
                        type="tip"
                        title="Process Mining Analysis"
                        message="This shows where time is being spent in your hiring process. Red = needs improvement, Yellow = monitor, Green = doing well."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <BigStat
                            label="Total Process Time"
                            value={`${PROCESS_STEPS.reduce((sum, s) => sum + s.avgDays, 0)}d`}
                            color="teal"
                        />
                        <BigStat
                            label="Slowest Step"
                            value="Evaluation → Offer"
                            color="amber"
                        />
                        <BigStat
                            label="Steps Needing Attention"
                            value={criticalSteps}
                            color="amber"
                        />
                    </div>

                    <Card
                        title="Where Your Time Goes"
                        subtitle="Average days spent at each hiring stage"
                    >
                        <div className="space-y-4">
                            {PROCESS_STEPS.map((step, i) => {
                                const statusColors = {
                                    good: { bg: "bg-green-50", bar: "bg-green-500", text: "text-green-700" },
                                    warning: { bg: "bg-amber-50", bar: "bg-amber-500", text: "text-amber-700" },
                                    critical: { bg: "bg-red-50", bar: "bg-red-500", text: "text-red-700" },
                                };
                                const colors = statusColors[step.status];

                                return (
                                    <div key={i} className={`${colors.bg} rounded-lg p-4`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-slate-800 text-sm">{step.step}</span>
                                            <span className={`font-bold ${colors.text}`}>{step.avgDays} days</span>
                                        </div>
                                        <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${colors.bar}`}
                                                style={{ width: `${(step.avgDays / 12) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    <Card title="How to Improve" subtitle="Action items to speed up hiring">
                        <div className="space-y-3">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="bg-red-100 text-red-700 rounded-lg p-2">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm text-red-900">Critical: Speed Up Committee Decisions</div>
                                        <div className="text-xs text-red-800 mt-1">
                                            Evaluation → Offer takes 12 days (target: 7 days). Set firm deadlines for committee reviews.
                                        </div>
                                        <div className="text-xs font-semibold text-red-700 mt-2">
                                            💰 Potential savings: 5 days per hire
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="bg-amber-100 text-amber-700 rounded-lg p-2">
                                        <Target size={20} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm text-amber-900">Standardize Interview Scheduling</div>
                                        <div className="text-xs text-amber-800 mt-1">
                                            Screen → Interview takes 9 days. Use calendar automation to reduce to 6 days.
                                        </div>
                                        <div className="text-xs font-semibold text-amber-700 mt-2">
                                            💰 Potential savings: 3 days per hire
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="bg-green-100 text-green-700 rounded-lg p-2">
                                        <Zap size={20} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm text-green-900">Quick Wins Working Well</div>
                                        <div className="text-xs text-green-800 mt-1">
                                            Post → Screen (3d) and Interview → Evaluation (5d) are efficient. Keep doing what you're doing!
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card title="Time Breakdown">
                            <div className="h-64">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={PROCESS_STEPS.map(s => ({
                                                name: s.step,
                                                value: s.avgDays
                                            }))}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            dataKey="value"
                                        >
                                            {PROCESS_STEPS.map((step, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={
                                                        step.status === "critical" ? COLORS.red :
                                                            step.status === "warning" ? COLORS.amber :
                                                                COLORS.green
                                                    }
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card title="Your Process Health">
                            <div className="space-y-6 py-4">
                                <div className="text-center">
                                    <div className="text-5xl font-bold text-teal-600 mb-2">B+</div>
                                    <div className="text-sm text-slate-600">Overall Grade</div>
                                    <div className="text-xs text-slate-500 mt-1">Good, but room to improve</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="bg-green-50 rounded-lg p-3">
                                        <div className="text-2xl font-bold text-green-600">3</div>
                                        <div className="text-xs text-slate-600 mt-1">Steps on track</div>
                                    </div>
                                    <div className="bg-amber-50 rounded-lg p-3">
                                        <div className="text-2xl font-bold text-amber-600">2</div>
                                        <div className="text-xs text-slate-600 mt-1">Need attention</div>
                                    </div>
                                </div>

                                <div className="text-xs text-slate-500 text-center">
                                    Industry average: 36 days<br />
                                    Your average: {PROCESS_STEPS.reduce((sum, s) => sum + s.avgDays, 0)} days ✓
                                </div>
                            </div>
                        </Card>
                    </div>
                </>
            )}

            {/* Bottom Help */}
            <div className="bg-white rounded-xl border p-5">
                <div className="flex items-start gap-3">
                    <div className="bg-slate-100 text-slate-600 rounded-lg p-2">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <div className="font-semibold text-slate-800 text-sm mb-2">Quick Guide</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                            <div>
                                <span className="font-medium text-slate-800">Overview:</span> See trends and compare departments
                            </div>
                            <div>
                                <span className="font-medium text-slate-800">AI Predictions:</span> Forecast how long new positions will take
                            </div>
                            <div>
                                <span className="font-medium text-slate-800">Process Analysis:</span> Find bottlenecks and fix them
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}