"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";
import { deanListRenewals, deanSubmitRecommendation } from "@/services/renewals";
import type { RenewalRow } from "@/types/renewals";
import { readMock, writeMock, updateMockRecommendation } from "@/lib/mockRenewals";

export default function DeanRenewalsPage() {
  const [rows, setRows] = useState<RenewalRow[]>([]);
  const [remarks, setRemarks] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);

  async function load() {
    setLoading(true);
    try {
      if (useMock) {
        setRows(readMock());
      } else {
        const res = await deanListRenewals({ take: 50 });
        setRows(res.items.length ? res.items : readMock()); // fallback to mock if empty
      }
    } catch {
      setRows(readMock());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [useMock]);

  const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : "—");
  const recBadge = (v: RenewalRow["deanRecommendation"]) =>
    v === "PENDING" ? <Badge tone="yellow">Pending</Badge>
    : v === "RENEW" ? <Badge tone="green">Renew</Badge>
    : <Badge tone="red">Not Renew</Badge>;

  async function act(id: string, rec: "RENEW" | "NOT_RENEW") {
    // optimistic UI
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, deanRecommendation: rec, deanRemarks: remarks || r.deanRemarks, updatedAt: new Date().toISOString() } : r
      )
    );

    if (useMock) {
      // persist to localStorage so HR sees it too when using mock
      const updated = updateMockRecommendation(id, rec, remarks || undefined);
      setRows(updated);
    } else {
      // try real API; if it fails, at least the optimistic UI changed
      try {
        await deanSubmitRecommendation(id, { deanRecommendation: rec, deanRemarks: remarks || undefined });
      } catch (e) {
        console.warn("PATCH failed—falling back to local mock for consistency", e);
        // write to mock too so HR (mock) can reflect it
        writeMock(updateMockRecommendation(id, rec, remarks || undefined));
      }
    }

    setRemarks("");
    setSelectedId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader title="Faculty Renewals" subtitle="Recommend renewals for faculty contracts" />
        <button
          onClick={() => setUseMock((v) => !v)}
          className={`rounded-md px-3 py-2 border ${useMock ? "bg-black text-white" : ""}`}
          title="Toggle mock data"
        >
          {useMock ? "Using Mock" : "Use Mock"}
        </button>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Faculty Name</th>
              <th>Position</th>
              <th>Type</th>
              <th>Contract End</th>
              <th>Recommendation</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={6}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-3" colSpan={6}>No records</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.facultyName}</td>
                <td>{r.position}</td>
                <td>{r.type}</td>
                <td>{fmtDate(r.contractEndDate)}</td>
                <td>{recBadge(r.deanRecommendation)}</td>
                <td className="space-x-2 p-3">
                  <button onClick={() => setSelectedId(r.id)} className="rounded-md border px-3 py-1">
                    Write Remarks
                  </button>
                  <button onClick={() => act(r.id, "RENEW")} className="rounded-md bg-green-600 text-white px-3 py-1">
                    ✓ Renew
                  </button>
                  <button onClick={() => act(r.id, "NOT_RENEW")} className="rounded-md bg-red-600 text-white px-3 py-1">
                    ✗ Not Renew
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Remarks panel */}
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Additional Remarks</h3>
          <span className="text-xs text-gray-500">
            {selectedId ? `Target ID: ${selectedId}` : 'Select “Write Remarks”'}
          </span>
        </div>
        <textarea
          className="w-full border rounded-lg p-3 min-h-[140px]"
          placeholder="Enter any additional comments or recommendations..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-2">
          Tip: The text above is saved when you click “✓ Renew” or “✗ Not Renew”.
        </p>
      </div>
    </div>
  );
}
