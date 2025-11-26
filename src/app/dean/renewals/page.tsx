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
  status: string; // raw Contract.status value
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

  // Normalize status to decide badge
  const statusBadge = (s: string) => {
    const val = s.toUpperCase().replace(/\s+/g, "_"); // e.g. "Pending Dean" -> "PENDING_DEAN"

    if (val === "APPROVED" || val === "RENEWED") {
      return <Badge tone="green">Approved</Badge>;
    }
    if (val === "NOT_RENEW" || val === "REJECTED") {
      return <Badge tone="red">Not Renew</Badge>;
    }
    // Everything else is treated as pending
    return <Badge tone="yellow">Pending Dean</Badge>;
  };

  // Final statuses = decision already made
  const isFinalStatus = (s: string) => {
    const val = s.toUpperCase().replace(/\s+/g, "_");
    return val === "APPROVED" || val === "RENEWED" || val === "NOT_RENEW" || val === "REJECTED";
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
              rows.map((r) => {
                const final = isFinalStatus(r.status);

                return (
                  <tr key={r.id} className="border-t">
                    <td className="p-3">{r.facultyName}</td>
                    <td>{r.position}</td>
                    <td>{r.type ?? "—"}</td>
                    <td>{fmtDate(r.contractEndDate)}</td>
                    <td>{statusBadge(r.status)}</td>
                    <td className="p-3 space-x-2">
                      {final ? (
                        <span className="text-xs text-gray-500">
                          Decision Submitted
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => act(r.id, "RENEW")}
                            className="rounded-md bg-green-600 text-white px-3 py-1 transition hover:bg-green-700 hover:shadow-sm active:scale-95"
                            title="Recommend to renew this contract"
                          >
                            ✓ Renew
                          </button>
                          <button
                            onClick={() => act(r.id, "NOT_RENEW")}
                            className="rounded-md bg-red-600 text-white px-3 py-1 transition hover:bg-red-700 hover:shadow-sm active:scale-95"
                            title="Recommend not to renew this contract"
                          >
                            ✗ Not Renew
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
