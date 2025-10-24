// src/app/dean/dashboard/page.tsx
"use client";

import { useMemo, useState } from "react";
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

/* ---------------- Demo data (same as HR) ---------------- */
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

/* ---------------- Tiny components (inline) ---------------- */
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

/** View-only KPI tile (no navigation) */
function StatTileViewOnly({
  title,
  value,
  subtitle,
  tone = "teal",
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  tone?: "teal" | "mint" | "sand" | "sky";
}) {
  const tones: Record<string, { container: string; icon: string }> = {
    teal: { container: "bg-teal-600 text-white", icon: "bg-white/25 text-white" },
    mint: { container: "bg-teal-50 text-slate-900 border border-teal-100", icon: "bg-teal-100 text-teal-700" },
    sand: { container: "bg-amber-50 text-slate-900 border border-amber-100", icon: "bg-amber-100 text-amber-700" },
    sky: { container: "bg-cyan-50 text-slate-900 border border-cyan-100", icon: "bg-cyan-100 text-cyan-700" },
  };

  const t = tones[tone];

  return (
    <div
      className={[
        "rounded-2xl w-full p-4 shadow-sm border select-none",
        "cursor-default",
        t.container,
      ].join(" ")}
      aria-disabled
    >
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-medium opacity-90">{title}</div>
        <span className={["inline-flex items-center justify-center rounded-lg p-1.5", t.icon].join(" ")}>
          <span className="text-[11px]">▣</span>
        </span>
      </div>
      <div className="mt-1 text-3xl font-extrabold tracking-tight">{value}</div>
      {subtitle && <div className="mt-1 text-[11px] opacity-90">{subtitle}</div>}
    </div>
  );
}

/* ---------------- Page (VIEW ONLY) ---------------- */
export default function DeanDashboard() {
  // Mock data (view only; no navigation)
  const [openRoles] = useState<OpenRole[]>(MOCK_OPEN_ROLES);
  const [ttfRows] = useState<TimeToFillRow[]>(MOCK_TTF);
  const [pending] = useState<PendingActionCounts>(MOCK_PENDING);

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PageHeader
          title="Dean Dashboard"
          subtitle="Read-only view of hiring status and performance"
        />
      </div>

      {/* --- Pending (view-only tiles) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatTileViewOnly
          title="Applications to Review"
          value={pending.toReview}
          subtitle="Awaiting screening (HR handles)"
          tone="teal"
        />
        <StatTileViewOnly
          title="Offers to Approve"
          value={pending.offersToApprove}
          subtitle="Pending approvals (HR handles)"
          tone="sky"
        />
        <StatTileViewOnly
          title="Contracts to Renew"
          value={pending.contractsToRenew}
          subtitle="For awareness only"
          tone="sand"
        />
      </div>

      {/* Row: Progress + Expanded Pipeline (no clicks) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="grid grid-cols-1 gap-3">
          <Progress
            label="Positions Filled — This Month"
            value={MOCK_FILLED.month.value}
            target={MOCK_FILLED.month.target}
          />
          <Progress
            label="Positions Filled — This Quarter"
            value={MOCK_FILLED.quarter.value}
            target={MOCK_FILLED.quarter.target}
          />
          <Progress
            label="Positions Filled — This Year"
            value={MOCK_FILLED.year.value}
            target={MOCK_FILLED.year.target}
          />
        </div>

        <div className="lg:col-span-2">
          <Panel
            title="Hiring Pipeline Status"
            subtitle="Applications → Screening → Interviews → Offers → Accepted (view only)"
          >
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart
                  data={MOCK_PIPELINE}
                  barCategoryGap={20}
                  margin={{ top: 10, right: 16, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis
                    dataKey="stage"
                    stroke="#64748b"
                    interval={0}
                    tick={{ fontSize: 12 }}
                    height={40}
                    tickMargin={8}
                  />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                    {MOCK_PIPELINE.map((_, i) => (
                      <Cell key={i} fill={cellColor(i)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </div>

      {/* Row: Current Open Positions + Time to Fill (view only) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel
          title="Current Open Positions"
          subtitle="Number open by department & average days open"
        >
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={openByDept}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="dept" stroke="#64748b" />
                <YAxis yAxisId="left" stroke="#64748b" />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="open" name="Open Roles" radius={[6, 6, 0, 0]}>
                  {openByDept.map((_, i) => (
                    <Cell key={i} fill={COLORS.tealA} />
                  ))}
                </Bar>
                <Bar yAxisId="right" dataKey="avgDaysOpen" name="Avg Days Open" radius={[6, 6, 0, 0]}>
                  {openByDept.map((_, i) => (
                    <Cell key={i} fill={COLORS.amber} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Time to Fill" subtitle="Average days to fill by department">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={ttfByDept}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="dept" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgDays" name="Avg Days to Fill" radius={[6, 6, 0, 0]}>
                  {ttfByDept.map((_, i) => (
                    <Cell key={i} fill={COLORS.tealB} />
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
