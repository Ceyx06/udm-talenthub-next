"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";

type DeanRow = {
  id: string;
  faculty_id: string;
  name: string | null;
  emp_type: string | null; // may be null (placeholder from the view)
  position: string;
  contract_end: string; // ISO date
  dean_decision: "pending" | "renew" | "not_renew";
  dean_remarks: string | null;
};

export default function Page() {
  const [rows, setRows] = useState<DeanRow[]>([]);
  const [remarks, setRemarks] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const RecBadge = ({ d }: { d: DeanRow["dean_decision"] }) =>
    d === "renew" ? (
      <Badge tone="blue">Renew</Badge>
    ) : d === "not_renew" ? (
      <Badge tone="red">Not Renew</Badge>
    ) : (
      <Badge tone="gray">Pending</Badge>
    );

  return (
    <div className="space-y-4">
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
              <th>Recommendation</th>
              <th className="w-48">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={6}>
                  Loading…
                </td>
              </tr>
            )}
            {err && !loading && (
              <tr>
                <td className="p-3 text-red-600" colSpan={6}>
                  {err}
                </td>
              </tr>
            )}
            {!loading && !err && rows.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={6}>
                  No candidates for renewal.
                </td>
              </tr>
            )}
            {!loading &&
              !err &&
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.name ?? "—"}</td>
                  <td>{r.position}</td>
                  <td>
                    <Badge tone="gray">{r.emp_type ?? "—"}</Badge>
                  </td>
                  <td>{new Date(r.contract_end).toISOString().slice(0, 10)}</td>
                  <td>
                    <RecBadge d={r.dean_decision} />
                  </td>
                  <td className="pr-3 text-right space-x-2">
                    <button
                      disabled={busyId === r.id}
                      onClick={() => {}}
                      className="rounded-md bg-blue-900 text-white px-3 py-1 disabled:opacity-60"
                    >
                      ✓ Renew
                    </button>
                    <button
                      disabled={busyId === r.id}
                      onClick={() => {}}
                      className="rounded-md bg-red-500 text-white px-3 py-1 disabled:opacity-60"
                    >
                      ✕ Not Renew
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm font-medium mb-2">Additional Remarks</div>
        <textarea
          className="w-full rounded-md border p-2"
          rows={4}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Enter any additional comments or recommendations..."
        />
        <div className="mt-2 text-xs text-gray-500">
          Tip: The text above is saved when you click “✓ Renew” or “✕ Not
          Renew.”
        </div>
      </div>
    </div>
  );
}
