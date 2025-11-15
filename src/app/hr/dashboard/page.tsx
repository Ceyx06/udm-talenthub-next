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

interface Application {
    id: string;
    stage: string;
    status: string;
    createdAt: string;
    vacancy?: {
        title: string;
        college: string;
    };
}

interface PipelineStage {
    stage: string;
    count: number;
}

interface PendingActionCounts {
    toReview: number;
    offersToApprove: number;
    contractsToRenew: number;
}

/* ---------------- Colors ---------------- */
const COLORS = {
    tealA: "#0d9488",
    tealB: "#10b981",
    tealC: "#2dd4bf",
    amber: "#f59e0b",
    red: "#ef4444",
    cyan: "#06b6d4",
};

/* ---------------- Components ---------------- */
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
    
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch applications from API
    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const response = await fetch('/api/application');
                const data = await response.json();
                
                if (data.success) {
                    setApplications(data.data);
                }
            } catch (error) {
                console.error('Error fetching applications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

    // Calculate pending actions from real data
    const pending: PendingActionCounts = useMemo(() => {
        return {
            toReview: applications.filter(a => 
                a.stage === 'APPLIED' || a.stage === 'PENDING'
            ).length,
            offersToApprove: applications.filter(a => 
                a.stage === 'ENDORSED' && a.status === 'ENDORSED'
            ).length,
            contractsToRenew: applications.filter(a => 
                a.stage === 'FOR_HIRING'
            ).length,
        };
    }, [applications]);

    // Calculate pipeline stages
    const pipelineData: PipelineStage[] = useMemo(() => {
        const stages = ['APPLIED', 'PENDING', 'ENDORSED', 'INTERVIEW_SCHEDULED', 'EVALUATED', 'HIRED'];
        const stageLabels: Record<string, string> = {
            'APPLIED': 'Applications',
            'PENDING': 'Screening',
            'ENDORSED': 'Endorsed',
            'INTERVIEW_SCHEDULED': 'Interviews',
            'EVALUATED': 'Evaluated',
            'HIRED': 'Hired'
        };
        
        return stages.map(stage => ({
            stage: stageLabels[stage] || stage,
            originalStage: stage,
            count: applications.filter(a => a.stage === stage).length
        }));
    }, [applications]);

    // Calculate positions filled (hired applications)
    const filledStats = useMemo(() => {
        const now = new Date();
        const thisMonth = applications.filter(a => {
            if (a.stage !== 'HIRED') return false;
            const created = new Date(a.createdAt);
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length;

        const thisQuarter = applications.filter(a => {
            if (a.stage !== 'HIRED') return false;
            const created = new Date(a.createdAt);
            const quarter = Math.floor(now.getMonth() / 3);
            const createdQuarter = Math.floor(created.getMonth() / 3);
            return quarter === createdQuarter && created.getFullYear() === now.getFullYear();
        }).length;

        const thisYear = applications.filter(a => {
            if (a.stage !== 'HIRED') return false;
            const created = new Date(a.createdAt);
            return created.getFullYear() === now.getFullYear();
        }).length;

        return {
            month: { value: thisMonth, target: 18 },
            quarter: { value: thisQuarter, target: 45 },
            year: { value: thisYear, target: 120 },
        };
    }, [applications]);

    // Calculate applications by department
    const applicationsByDept = useMemo(() => {
        const depts = ['CAS', 'CHS', 'CBPM', 'CCJ', 'CED', 'CCS'];
        
        return depts.map(dept => {
            const deptApps = applications.filter(a => 
                a.vacancy?.college === dept && a.stage !== 'REJECTED'
            );
            
            return {
                dept,
                count: deptApps.length,
                active: deptApps.filter(a => ['APPLIED', 'PENDING', 'ENDORSED', 'INTERVIEW_SCHEDULED'].includes(a.stage)).length
            };
        });
    }, [applications]);

    // Chart colors
    const cellColor = (i: number) =>
        [COLORS.tealA, COLORS.tealB, COLORS.tealC, COLORS.cyan, COLORS.amber, COLORS.red][i % 6];

    // Navigation helpers
    const gotoApplicants = (stage: string) => {
        router.push(`/hr/applicants?stage=${encodeURIComponent(stage)}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
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

            {/* Pending Actions KPI tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatTile
                    title="Applications to Review"
                    value={pending.toReview}
                    subtitle="Awaiting screening"
                    tone="teal"
                    onClick={() => router.push("/hr/applicants?stage=PENDING")}
                />
                <StatTile
                    title="Endorsed Applications"
                    value={pending.offersToApprove}
                    subtitle="Ready for interview"
                    tone="sky"
                    onClick={() => router.push("/hr/applicants?stage=ENDORSED")}
                />
                <StatTile
                    title="For Hiring"
                    value={pending.contractsToRenew}
                    subtitle="Final approval stage"
                    tone="sand"
                    onClick={() => router.push("/hr/applicants?stage=FOR_HIRING")}
                />
            </div>

            {/* Progress + Pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="grid grid-cols-1 gap-3">
                    <Progress
                        label="Positions Filled — This Month"
                        value={filledStats.month.value}
                        target={filledStats.month.target}
                    />
                    <Progress
                        label="Positions Filled — This Quarter"
                        value={filledStats.quarter.value}
                        target={filledStats.quarter.target}
                    />
                    <Progress
                        label="Positions Filled — This Year"
                        value={filledStats.year.value}
                        target={filledStats.year.target}
                    />
                </div>

                <div className="lg:col-span-2">
                    <Panel
                        title="Hiring Pipeline Status"
                        subtitle="Funnel from Applications → Hired (click a bar to view applicants)"
                    >
                        <div className="h-80">
                            <ResponsiveContainer>
                                <BarChart
                                    data={pipelineData}
                                    barCategoryGap={20}
                                    margin={{ top: 10, right: 16, left: 0, bottom: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                    <XAxis
                                        dataKey="stage"
                                        stroke="#64748b"
                                        interval={0}
                                        tick={{ fontSize: 11 }}
                                        height={50}
                                        tickMargin={8}
                                        angle={-15}
                                    />
                                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar
                                        dataKey="count"
                                        name="Applications"
                                        radius={[6, 6, 0, 0]}
                                        onClick={(e) => gotoApplicants((e?.payload as any)?.originalStage)}
                                    >
                                        {pipelineData.map((_, i) => (
                                            <Cell key={i} cursor="pointer" fill={cellColor(i)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Panel>
                </div>
            </div>

            {/* Applications by Department */}
            <div className="grid grid-cols-1 gap-4">
                <Panel
                    title="Applications by Department"
                    subtitle="Total applications and active candidates by college"
                >
                    <div className="h-72">
                        <ResponsiveContainer>
                            <BarChart data={applicationsByDept}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                <XAxis dataKey="dept" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey="count"
                                    name="Total Applications"
                                    radius={[6, 6, 0, 0]}
                                    fill={COLORS.tealA}
                                />
                                <Bar
                                    dataKey="active"
                                    name="Active Candidates"
                                    radius={[6, 6, 0, 0]}
                                    fill={COLORS.cyan}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <p className="text-sm text-gray-600">Total Applications</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{applications.length}</p>
                </div>
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <p className="text-sm text-gray-600">Active Candidates</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">
                        {applications.filter(a => !['REJECTED', 'HIRED'].includes(a.stage)).length}
                    </p>
                </div>
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <p className="text-sm text-gray-600">Hired This Year</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                        {filledStats.year.value}
                    </p>
                </div>
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <p className="text-sm text-gray-600">Rejected</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">
                        {applications.filter(a => a.stage === 'REJECTED').length}
                    </p>
                </div>
            </div>
        </div>
    );
}