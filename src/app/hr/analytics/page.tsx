"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Area, AreaChart
} from "recharts";
import { TrendingUp, Calendar, AlertCircle, Building2, Users, FileText } from "lucide-react";

/* ---------- Types ---------- */
type HistoryPoint = { month: string; actual: number; timestamp: number };
type ForecastPoint = { month: string; predicted: number; lower: number; upper: number; timestamp: number };
type DeptRow = { name: string; current: number; q1: number; q2: number; growth: string; risk: "low" | "medium" | "high" };
type ContractRow = { month: string; expirations: number; expectedVacancies: number };

type ApiPayload = {
    history: HistoryPoint[];
    forecast: ForecastPoint[];
    departmentForecast: DeptRow[];
    contracts: ContractRow[];
};

export default function Page() {
    const [payload, setPayload] = useState<ApiPayload | null>(null);
    const [timeRange, setTimeRange] = useState<"3months" | "6months" | "12months">("6months");
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                setErr(null);
                // matches your API path
                const res = await fetch("/api/hr/analytics?horizon=12", { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to load analytics");
                const json = await res.json() as ApiPayload;
                if (alive) setPayload(json);
            } catch (e: any) {
                if (alive) setErr(e?.message || "Failed to load analytics");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    const horizon = timeRange === "3months" ? 3 : timeRange === "6months" ? 6 : 12;
    const history6 = useMemo(() => (payload?.history ?? []).slice(-6), [payload?.history]);
    const forecastH = useMemo(() => (payload?.forecast ?? []).slice(0, Math.max(0, horizon)), [payload?.forecast, horizon]);
    const combinedData = useMemo(() => [
        ...history6.map(m => ({ ...m, type: "actual" as const })),
        ...forecastH.map(f => ({ ...f, type: "forecast" as const })),
    ], [history6, forecastH]);

    const totalPredicted = useMemo(() => forecastH.reduce((s, f) => s + (f?.predicted ?? 0), 0), [forecastH]);
    const avgMonthly = forecastH.length ? Math.round(totalPredicted / forecastH.length) : 0;
    const peakVal = forecastH.length ? Math.max(...forecastH.map(f => f.predicted)) : 0;
    const peakMonth = forecastH.find(f => f.predicted === peakVal)?.month ?? "—";

    if (loading && !payload) return <div className="p-8">Loading…</div>;
    if (err) return (
        <div className="p-8">
            <p className="text-red-600 mb-3">Error: {err}</p>
            <button className="rounded-md bg-indigo-600 text-white px-4 py-2" onClick={() => location.reload()}>Retry</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <TrendingUp className="text-indigo-600" size={32} />
                        HR Analytics — Vacancy Forecast
                    </h1>
                    <p className="text-gray-600 mt-2">DB-backed predictions for strategic workforce planning</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Next Quarter Total</p>
                                <p className="text-2xl font-bold text-indigo-600 mt-1">
                                    {forecastH.slice(0, 3).reduce((s, f) => s + f.predicted, 0)}
                                </p>
                            </div>
                            <Calendar className="text-indigo-400" size={32} />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Expected vacancies (next 3 months)</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Avg Monthly</p>
                                <p className="text-2xl font-bold text-blue-600 mt-1">{avgMonthly}</p>
                            </div>
                            <FileText className="text-blue-400" size={32} />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Predicted average per month</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Peak Month</p>
                                <p className="text-2xl font-bold text-orange-600 mt-1">{peakVal}</p>
                            </div>
                            <AlertCircle className="text-orange-400" size={32} />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{peakMonth}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Confidence</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">—</p>
                            </div>
                            <TrendingUp className="text-green-400" size={32} />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Hook real model metrics later</p>
                    </div>
                </div>

                {/* Time Range Selector */}
                <div className="mb-6 flex gap-2">
                    {(["3months", "6months", "12months"] as const).map(range => (
                        <button key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${timeRange === range ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                                }`}>
                            {range === "3months" ? "3 Months" : range === "6months" ? "6 Months" : "1 Year"}
                        </button>
                    ))}
                </div>

                {/* Main Forecast Chart */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-indigo-600" />
                        Vacancy Demand Forecast
                    </h2>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={combinedData}>
                            <defs>
                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}
                                formatter={(value: any, name: string) => {
                                    if (name === "upper") return [value as number, "Upper Bound"];
                                    if (name === "lower") return [value as number, "Lower Bound"];
                                    if (name === "predicted") return [value as number, "Predicted"];
                                    return [value as number, "Actual"];
                                }}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="actual" stroke="#6366f1" fill="url(#colorActual)" name="Historical" />
                            <Area type="monotone" dataKey="predicted" stroke="#f59e0b" fill="url(#colorForecast)" name="Forecast" />
                            <Area type="monotone" dataKey="upper" stroke="#fbbf24" strokeDasharray="3 3" fill="none" name="Upper Bound" />
                            <Area type="monotone" dataKey="lower" stroke="#fbbf24" strokeDasharray="3 3" fill="none" name="Lower Bound" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Department Forecast */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Building2 size={20} className="text-indigo-600" />
                            Department Breakdown
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={payload?.departmentForecast ?? []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }} />
                                <Legend />
                                <Bar dataKey="current" fill="#6366f1" name="Current" />
                                <Bar dataKey="q1" fill="#f59e0b" name="Next Quarter" />
                                <Bar dataKey="q2" fill="#10b981" name="Q2 Forecast" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Contract Expirations */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Users size={20} className="text-indigo-600" />
                            Contract Expirations Impact
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={payload?.contracts ?? []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="month" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }} />
                                <Legend />
                                <Line type="monotone" dataKey="expirations" stroke="#ef4444" strokeWidth={2} name="Expiring Contracts" />
                                <Line type="monotone" dataKey="expectedVacancies" stroke="#f59e0b" strokeWidth={2} name="Expected Vacancies" />
                            </LineChart>
                        </ResponsiveContainer>
                        <p className="text-sm text-gray-600 mt-3">
                            Assumes 60% conversion to vacancies (tune in the API)
                        </p>
                    </div>
                </div>

                {/* Risk Table */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Department Risk Analysis</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Current Open</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Q1 Predicted</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Growth</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Risk Level</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(payload?.departmentForecast ?? []).map((dept, i) => (
                                    <tr key={`${dept.name}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium">{dept.name}</td>
                                        <td className="py-3 px-4">{dept.current}</td>
                                        <td className="py-3 px-4 font-semibold text-indigo-600">{dept.q1}</td>
                                        <td className="py-3 px-4"><span className="text-green-600 font-medium">{dept.growth}</span></td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${dept.risk === "high" ? "bg-red-100 text-red-700" :
                                                    dept.risk === "medium" ? "bg-yellow-100 text-yellow-700" :
                                                        "bg-green-100 text-green-700"
                                                }`}>
                                                {dept.risk.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {dept.risk === "high" ? (
                                                <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Plan Recruitment →</button>
                                            ) : dept.risk === "medium" ? (
                                                <button className="text-sm text-gray-600 hover:text-gray-800">Monitor</button>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                                {(payload?.departmentForecast ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-6 px-4 text-center text-gray-500">No department data available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Insights */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg shadow p-6 mt-6 text-white">
                    <h3 className="text-lg font-semibold mb-3">🎯 Strategic Insights</h3>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-300 mt-1">•</span>
                            <span><strong>Peak hiring period:</strong> {peakMonth} — start recruitment 60 days earlier</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-300 mt-1">•</span>
                            <span><strong>Computer Science:</strong> If trending high, consider a standing search committee</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-300 mt-1">•</span>
                            <span><strong>Contract renewals:</strong> {(payload?.contracts ?? [])[0]?.expirations ?? 0} expiring this month — proactive retention recommended</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-300 mt-1">•</span>
                            <span><strong>Budget planning:</strong> Allocate for {totalPredicted} positions over next {timeRange === "3months" ? "3" : timeRange === "6months" ? "6" : "12"} months</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
