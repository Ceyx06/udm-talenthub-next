"use client";

import { useEffect, useState } from "react";

type Application = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  coverLetter: string;
  resumeUrl: string;
  status: string;
  appliedDate: string;
};

export default function ApplicationsModal({
  vacancy,
  onClose,
}: {
  vacancy: { id: string; title: string };
  onClose: () => void;
}) {
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // expects you created GET /api/hr/vacancies/:id/applications
        const res = await fetch(`/api/hr/vacancies/${vacancy.id}/applications`, { cache: "no-store" });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
        setRows(j.data ?? j); // support either {data:[]} or []
      } catch (e: any) {
        setErr(e.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    })();
  }, [vacancy.id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-lg">Applications — {vacancy.title}</h3>
          <button onClick={onClose} className="text-sm rounded-md border px-3 py-1">Close</button>
        </div>

        {loading ? (
          <div className="p-6">Loading applications…</div>
        ) : err ? (
          <div className="p-6 text-sm text-red-600">{err}</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">No applications yet.</div>
        ) : (
          <div className="p-4 overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-600">
                  <th className="p-2">Applicant</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Applied</th>
                  <th className="p-2">Resume</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {rows.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="p-2">{a.fullName}</td>
                    <td className="p-2">{a.email}</td>
                    <td className="p-2">{a.phone}</td>
                    <td className="p-2">{a.status}</td>
                    <td className="p-2">
                      {new Date(a.appliedDate).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}
                    </td>
                    <td className="p-2">
                      {a.resumeUrl ? (
                        <a className="text-blue-600 hover:underline" href={a.resumeUrl} target="_blank" rel="noreferrer">
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
