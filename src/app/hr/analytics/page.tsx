"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    LineChart, Line,
    BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell,
} from "recharts";
import { Zap, Target, TrendingUp, AlertCircle } from "lucide-react";

/* ========== Types ========== */
type TTFPoint = { month: string; days: number };
type DeptPerf = { dept: string; avgDays: number };
type ProcessStep = { step: string; avgDays: number; status: "good" | "warning" | "critical" };
type Prediction = { position: string; predictedDays: number; confidence: number };

interface AnalyticsData {
  overview: {
    avgTimeToFill: number;
    fastestDept: { dept: string; avgDays: number };
    improvement: number;
    trendData: TTFPoint[];
    deptPerformance: DeptPerf[];
  };
  process: {
    steps: ProcessStep[];
    criticalSteps: number;
    totalProcessTime: number;
  };
  predictions: Prediction[];
  stats: {
    totalApplications: number;
    totalHired: number;
    inProgress: number;
  };
}

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
    const [view, setView] = useState<"overview" | "predictions" | "process">("overview");
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/analytics');
            
            if (!response.ok) {
                throw new Error('Failed to fetch analytics');
            }

            const result = await response.json();
            
            if (result.success) {
                setData(result.data);
            } else {
                throw new Error(result.error || 'Failed to load analytics');
            }
        } catch (err: any) {
            console.error('Error fetching analytics:', err);
            setError(err.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error || 'No analytics data available'}
                </div>
                <button
                    onClick={fetchAnalytics}
                    className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">HR Analytics</h1>
                    <p className="text-slate-600 mt-1">Insights to improve your hiring process</p>
                    <p className="text-xs text-slate-500 mt-1">
                        Based on {data.stats.totalApplications} applications ({data.stats.totalHired} hired, {data.stats.inProgress} in progress)
                    </p>
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
                        <BigStat 
                            label="Average Time to Fill" 
                            value={`${data.overview.avgTimeToFill} days`} 
                            color="teal" 
                        />
                        <BigStat 
                            label="Fastest Department" 
                            value={`${data.overview.fastestDept.dept} (${data.overview.fastestDept.avgDays}d)`} 
                            color="cyan" 
                        />
                        <BigStat 
                            label="Improvement This Month" 
                            value={data.overview.improvement >= 0 ? `↓ ${data.overview.improvement} days` : `↑ ${Math.abs(data.overview.improvement)} days`}
                            color="teal" 
                        />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card
                            title="Time to Fill Trend"
                            subtitle="How long it takes to fill positions over time"
                        >
                            <div className="h-72">
                                <ResponsiveContainer>
                                    <LineChart data={data.overview.trendData}>
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
                                {data.overview.improvement >= 0 
                                    ? '✓ Good news: You\'re getting faster at hiring' 
                                    : '⚠ Hiring is taking longer this month'}
                            </p>
                        </Card>

                        <Card
                            title="Department Comparison"
                            subtitle="Average days to fill by department"
                        >
                            <div className="h-72">
                                <ResponsiveContainer>
                                    <BarChart data={data.overview.deptPerformance}>
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
                        {data.predictions.map((pred, i) => (
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
                                        If you need a position filled by a certain date, post it {data.overview.avgTimeToFill + 5} days before
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 p-3 bg-cyan-50 rounded-lg">
                                <div className="text-2xl">⚡</div>
                                <div>
                                    <div className="font-medium text-slate-800 text-sm">Set Realistic Expectations</div>
                                    <div className="text-xs text-slate-600 mt-1">
                                        Based on historical data, your average hiring time is {data.overview.avgTimeToFill} days
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
                            value={`${data.process.totalProcessTime}d`}
                            color="teal"
                        />
                        <BigStat
                            label="Slowest Step"
                            value={data.process.steps.sort((a, b) => b.avgDays - a.avgDays)[0]?.step || 'N/A'}
                            color="amber"
                        />
                        <BigStat
                            label="Steps Needing Attention"
                            value={data.process.criticalSteps}
                            color="amber"
                        />
                    </div>

                    <Card
                        title="Where Your Time Goes"
                        subtitle="Average days spent at each hiring stage"
                    >
                        <div className="space-y-4">
                            {data.process.steps.map((step, i) => {
                                const statusColors = {
                                    good: { bg: "bg-green-50", bar: "bg-green-500", text: "text-green-700" },
                                    warning: { bg: "bg-amber-50", bar: "bg-amber-500", text: "text-amber-700" },
                                    critical: { bg: "bg-red-50", bar: "bg-red-500", text: "text-red-700" },
                                };
                                const colors = statusColors[step.status];
                                const maxDays = Math.max(...data.process.steps.map(s => s.avgDays));

                                return (
                                    <div key={i} className={`${colors.bg} rounded-lg p-4`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-slate-800 text-sm">{step.step}</span>
                                            <span className={`font-bold ${colors.text}`}>{step.avgDays} days</span>
                                        </div>
                                        <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${colors.bar}`}
                                                style={{ width: `${(step.avgDays / maxDays) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    <Card title="How to Improve" subtitle="Action items to speed up hiring">
                        <div className="space-y-3">
                            {data.process.steps
                                .filter(s => s.status === 'critical')
                                .map((step, i) => (
                                    <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-red-100 text-red-700 rounded-lg p-2">
                                                <AlertCircle size={20} />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm text-red-900">Critical: Speed Up {step.step}</div>
                                                <div className="text-xs text-red-800 mt-1">
                                                    This step takes {step.avgDays} days (target: 7 days or less). Consider streamlining this process.
                                                </div>
                                                <div className="text-xs font-semibold text-red-700 mt-2">
                                                    💰 Potential savings: {Math.max(0, step.avgDays - 7)} days per hire
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            {data.process.steps
                                .filter(s => s.status === 'good')
                                .length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-green-100 text-green-700 rounded-lg p-2">
                                            <Zap size={20} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm text-green-900">Quick Wins Working Well</div>
                                            <div className="text-xs text-green-800 mt-1">
                                                {data.process.steps.filter(s => s.status === 'good').map(s => s.step).join(', ')} are efficient. Keep doing what you're doing!
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card title="Time Breakdown">
                            <div className="h-64">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={data.process.steps.map(s => ({
                                                name: s.step,
                                                value: s.avgDays
                                            }))}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry: any) => `${(entry.percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            dataKey="value"
                                        >
                                            {data.process.steps.map((step, i) => (
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
                                    <div className="text-5xl font-bold text-teal-600 mb-2">
                                        {data.process.criticalSteps === 0 ? 'A' : 
                                         data.process.criticalSteps === 1 ? 'B+' : 
                                         data.process.criticalSteps === 2 ? 'B' : 'C'}
                                    </div>
                                    <div className="text-sm text-slate-600">Overall Grade</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {data.process.criticalSteps === 0 ? 'Excellent!' : 
                                         data.process.criticalSteps <= 2 ? 'Good, but room to improve' : 
                                         'Needs improvement'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="bg-green-50 rounded-lg p-3">
                                        <div className="text-2xl font-bold text-green-600">
                                            {data.process.steps.filter(s => s.status === 'good').length}
                                        </div>
                                        <div className="text-xs text-slate-600 mt-1">Steps on track</div>
                                    </div>
                                    <div className="bg-amber-50 rounded-lg p-3">
                                        <div className="text-2xl font-bold text-amber-600">
                                            {data.process.criticalSteps}
                                        </div>
                                        <div className="text-xs text-slate-600 mt-1">Need attention</div>
                                    </div>
                                </div>

                                <div className="text-xs text-slate-500 text-center">
                                    Industry average: 36 days<br />
                                    Your average: {data.process.totalProcessTime} days {data.process.totalProcessTime < 36 ? '✓' : ''}
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