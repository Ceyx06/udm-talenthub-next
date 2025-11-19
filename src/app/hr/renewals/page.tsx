// src/app/hr/renewals/page.tsx
"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";
import type { RenewalRow } from "@/types/renewals";
import { readMock, filterMock } from "@/lib/mockRenewals";

export default function HRRenewalsPage() {
  const [rows, setRows] = useState<RenewalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  function load(opts?: { search?: string }) {
    setLoading(true);
    const q = (opts?.search ?? "").trim();
    const data = filterMock(readMock(), q);
    setRows(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString() : "—";

  const deanBadge = (v: RenewalRow["deanRecommendation"]) =>
    v === "RENEW" ? (
      <Badge tone="green">Renew</Badge>
    ) : v === "NOT_RENEW" ? (
      <Badge tone="red">Not Renew</Badge>
    ) : (
      <Badge tone="yellow">Pending</Badge>
    );

  const statusBadge = (s: RenewalRow["status"]) =>
    s === "APPROVED" ? (
      <Badge tone="green">Approved</Badge>
    ) : s === "REJECTED" ? (
      <Badge tone="red">Rejected</Badge>
    ) : (
      <Badge tone="yellow">Pending Dean</Badge>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <PageHeader title="Renewals" subtitle="Manage contract renewals" />

        {/* 🔽 Enter-to-search: wrapped in a form */}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            load({ search });
          }}
        >
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Search faculty/college/contract…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-md border px-3 py-2 hover:bg-gray-100 transition"
          >
            Search
          </button>
        </form>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Faculty Name</th>
              <th>College</th>
              <th>Contract No</th>
              <th>Position</th>
              <th>End Date</th>
              <th>Dean Recommendation</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={7}>
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={7}>
                  No records
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.facultyName}</td>
                  <td>{r.college ? <Badge tone="gray">{r.college}</Badge> : "—"}</td>
                  <td>{r.contractNo || "—"}</td>
                  <td>{r.position}</td>
                  <td>{fmtDate(r.contractEndDate)}</td>
                  <td>{deanBadge(r.deanRecommendation)}</td>
                  <td>{statusBadge(r.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => load({ search })}
          className="rounded-md border px-3 py-2 hover:bg-gray-100 transition"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
