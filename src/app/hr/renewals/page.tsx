// src/app/hr/renewals/page.tsx
"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";

type RenewalRow = {
  id: string;
  facultyName: string;
  college: string | null;
  contractNo: string;
  position: string;
  contractEndDate: string | null;
  status: string; // "PENDING_DEAN" | "APPROVED" | "REJECTED" ...
};

export default function HRRenewalsPage() {
  const [rows, setRows] = useState<RenewalRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr/renewals");
      if (!res.ok) {
        throw new Error("Failed to fetch renewals");
      }
      const data = await res.json();
      setRows(data.items ?? []);
    } catch (err) {
      console.error("Error loading HR renewals:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString() : "—";

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
        {/* search removed on purpose */}
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
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={6}>
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={6}>
                  No records
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.facultyName}</td>
                  <td>
                    {r.college ? (
                      <Badge tone="gray">{r.college}</Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{r.contractNo}</td>
                  <td>{r.position}</td>
                  <td>{fmtDate(r.contractEndDate)}</td>
                  <td>{statusBadge(r.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          onClick={load}
          className="rounded-md border px-3 py-2 hover:bg-gray-100 transition"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
