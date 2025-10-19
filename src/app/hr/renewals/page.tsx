"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";

type HRRow = {
  id: string;
  name: string | null;
  college_code: string;
  contract_no: string;
  position: string;
  contract_end: string; // ISO date
  dean_decision: "pending" | "renew" | "not_renew";
  hr_status: "Pending Dean" | "Approved" | "Disapproved";
};


export default function Page() {
  const [rows, setRows] = useState<HRRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);


  

  const statusTone = (s: HRRow["hr_status"]) =>
    s === "Approved" ? "green" : s === "Disapproved" ? "red" : "yellow";

  return (
    <div className="space-y-4">
      <PageHeader title="Renewals" subtitle="Manage contract renewals" />
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
            {loading && (
              <tr><td className="p-3 text-gray-500" colSpan={7}>Loading…</td></tr>
            )}
            {err && !loading && (
              <tr><td className="p-3 text-red-600" colSpan={7}>{err}</td></tr>
            )}
            {!loading && !err && rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.name ?? "—"}</td>
                <td><Badge tone="gray">{r.college_code}</Badge></td>
                <td>{r.contract_no}</td>
                <td>{r.position}</td>
                <td>{new Date(r.contract_end).toISOString().slice(0, 10)}</td>
                <td>
                  {r.dean_decision === "renew" ? (
                    <Badge tone="blue">Renew</Badge>
                  ) : r.dean_decision === "not_renew" ? (
                    <Badge tone="red">Not Renew</Badge>
                  ) : (
                    <Badge tone="gray">Pending</Badge>
                  )}
                </td>
                <td>
                  <Badge tone={statusTone(r.hr_status)}>{r.hr_status}</Badge>
                </td>
              </tr>
            ))}
            {!loading && !err && rows.length === 0 && (
              <tr><td className="p-3 text-gray-500" colSpan={7}>No records.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
