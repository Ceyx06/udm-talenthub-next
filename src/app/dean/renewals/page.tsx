// src/app/dean/renewals/page.tsx
"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";

type DeanRenewalRow = {
  id: string;
  facultyName: string;
  position: string;
  type: string | null;
  contractEndDate: string | null;
  status: string; // value from Contract.status
};

export default function DeanRenewalsPage() {
  const [rows, setRows] = useState<DeanRenewalRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dean/renewals");
      if (!res.ok) {
        throw new Error("Failed to fetch dean renewals");
      }
      const data = await res.json();
      setRows(data.items ?? []);
    } catch (err) {
      console.error("Error loading dean renewals:", err);
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

  const statusBadge = (s: DeanRenewalRow["status"]) => {
    // Adjust these checks to match your actual Contract.status enum values
    if (s === "APPROVED" || s === "RENEWED") {
      return <Badge tone="green">Approved</Badge>;
    }
    if (s === "REJECTED" || s === "NOT_RENEW") {
      return <Badge tone="red">Not Renew</Badge>;
    }
    // anything else is treated as "Pending Dean"
    return <Badge tone="yellow">Pending Dean</Badge>;
  };

  const act = async (id: string, decision: "RENEW" | "NOT_RENEW") => {
    try {
      setLoading(true);

      const res = await fetch(`/api/dean/renewals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });

      if (!res.ok) {
        console.error("Failed to update contract status");
      }

      await load();
    } catch (err) {
      console.error("Error updating contract status:", err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Renewals"
        subtitle="Recommend renewals for faculty contracts"
      />

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Faculty Name</th>
              <th>Position</th>
              <th>Type</th>
              <th>Contract End</th>
              <th>Status</th>
              <th>Actions</th>
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
                  <td>{r.position}</td>
                  <td>{r.type ?? "—"}</td>
                  <td>{fmtDate(r.contractEndDate)}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td className="space-x-2 p-3">
                    <button
                      onClick={() => act(r.id, "RENEW")}
                      title="Recommend to renew this contract"
                      className="rounded-md bg-green-600 text-white px-3 py-1 transition hover:bg-green-700 hover:shadow-sm active:scale-95"
                    >
                      ✓ Renew
                    </button>
                    <button
                      onClick={() => act(r.id, "NOT_RENEW")}
                      title="Recommend not to renew this contract"
                      className="rounded-md bg-red-600 text-white px-3 py-1 transition hover:bg-red-700 hover:shadow-sm active:scale-95"
                    >
                      ✗ Not Renew
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Write Remarks + Additional Remarks removed as requested */}
    </div>
  );
}
