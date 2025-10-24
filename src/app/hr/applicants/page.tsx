"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";

type Stage = "Pending" | "Conducted" | "Evaluating" | string;

type Row = {
  id: string;
  name: string;
  email: string;
  job: string;
  college: string;
  phone: string;
  filesComplete: boolean;
  stage: Stage;
  attachments: { name: string; type: "pdf" | "image"; url?: string }[];
};

const canManageFiles = true;

export default function Page() {
  const sp = useSearchParams();
  const vacancyId = sp.get("vacancyId") || "";
  const stageFilter = sp.get("stage") || "";

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Row | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const qs = new URLSearchParams();
        if (vacancyId) qs.set("vacancyId", vacancyId);
        if (stageFilter) qs.set("stage", stageFilter);

        const res = await fetch(`/api/hr/applicants?${qs.toString()}`, { cache: "no-store" });
        const text = await res.text();

        let payload: any = [];
        try { payload = text ? JSON.parse(text) : []; } catch { /* non-JSON */ }

        if (!res.ok) throw new Error(payload?.error || text || `HTTP ${res.status}`);

        const mapped: Row[] = (payload?.data ?? payload ?? []).map((a: any) => {
          const complete = Boolean(a?.resumeUrl) && Boolean(a?.coverLetter);
          const stage: Stage = a?.stage || a?.status || "Pending";
          return {
            id: a.id,
            name: a.fullName || `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || "—",
            email: a.email,
            job: a?.vacancy?.title ?? "—",
            college: a?.vacancy?.college ?? "—",
            phone: a.phone ?? a.contactNo ?? "—",
            filesComplete: complete,
            stage,
            attachments: [
              ...(a.resumeUrl ? [{ name: "Resume", type: "pdf" as const, url: a.resumeUrl }] : []),
            ],
          };
        });

        if (live) setRows(mapped);
      } catch (e: any) {
        if (live) {
          setErr(e?.message || "Failed to load applicants");
          setRows([]);
        }
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [vacancyId, stageFilter]);

  function toggleFiles(r: Row) {
    if (!canManageFiles) return;
    setRows((prev) =>
      prev.map((row) =>
        row.id === r.id ? { ...row, filesComplete: !row.filesComplete } : row
      )
    );
  }

  function openViewer(r: Row) {
    setActive(r);
    setOpen(true);
  }

  function closeViewer() {
    setOpen(false);
    setActive(null);
  }

  function handleDelete(r: Row) {
    if (!confirm(`Delete applicant ${r.id} — ${r.name}?`)) return;
    setRows((prev) => prev.filter((row) => row.id !== r.id));
    // TODO: wire to DELETE /api/hr/applicants/:id
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applicants"
        subtitle={
          vacancyId
            ? `Filtered by vacancy: ${vacancyId}`
            : "Track and manage job applicants"
        }
      />

      {err && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
          Loading applicants...
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr className="text-gray-700">
                  <th className="p-3 font-medium">ID</th>
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Job Title</th>
                  <th className="p-3 font-medium">College</th>
                  <th className="p-3 font-medium">Phone</th>
                  <th className="p-3 font-medium">Files</th>
                  <th className="p-3 font-medium">Stage</th>
                  <th className="p-3 text-right font-medium w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-gray-50/60">
                    <td className="p-3">{r.id}</td>
                    <td className="p-3">{r.name}</td>
                    <td className="p-3">{r.email}</td>
                    <td className="p-3">{r.job}</td>
                    <td className="p-3">
                      <Badge tone="gray">{r.college}</Badge>
                    </td>
                    <td className="p-3">{r.phone}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => toggleFiles(r)}
                        disabled={!canManageFiles}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${r.filesComplete
                            ? "bg-green-100 text-green-800 ring-green-300"
                            : "bg-red-100 text-red-800 ring-red-300"
                          } ${!canManageFiles ? "cursor-not-allowed opacity-60" : "hover:opacity-90"}`}
                        aria-label={`Files status: ${r.filesComplete ? "Complete" : "Partial"} (click to toggle)`}
                      >
                        {r.filesComplete ? "Complete" : "Partial"}
                      </button>
                    </td>
                    <td className="p-3">
                      {r.stage === "Pending" && <Badge tone="gray">Pending</Badge>}
                      {r.stage === "Conducted" && <Badge tone="blue">Conducted</Badge>}
                      {r.stage === "Evaluating" && <Badge tone="purple">Evaluating</Badge>}
                      {!["Pending", "Conducted", "Evaluating"].includes(r.stage) && (
                        <Badge tone="gray">{r.stage}</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end items-center gap-3">
                        <button
                          onClick={() => handleDelete(r)}
                          className="text-red-600 hover:underline"
                          title="Delete"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => openViewer(r)}
                          className="rounded-md bg-blue-900 text-white px-3 py-1.5 hover:bg-blue-800"
                          title="View files"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-gray-500">
                      {vacancyId
                        ? "No applicants for this vacancy yet."
                        : "No applicants found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {open && active && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={closeViewer}
        >
          <div
            className="w-full max-w-2xl rounded-xl border bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold">Applicant Files</h3>
                <p className="text-sm text-gray-500">
                  {active.id} • {active.name}
                </p>
              </div>
              <button onClick={closeViewer} className="rounded-md border px-2 py-1">
                ✕
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-gray-500">Files Status:</span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${active.filesComplete
                    ? "bg-green-100 text-green-800 ring-green-300"
                    : "bg-red-100 text-red-800 ring-red-300"
                  }`}
              >
                {active.filesComplete ? "Complete" : "Partial"}
              </span>
            </div>

            <div className="mt-4 rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr className="text-gray-700">
                    <th className="p-3 font-medium">File name</th>
                    <th className="p-3 font-medium">Type</th>
                    <th className="p-3 font-medium text-right w-24">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {active.attachments.map((f, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3">{f.name}</td>
                      <td className="p-3">
                        {f.type === "pdf" ? <Badge tone="gray">PDF</Badge> : <Badge tone="blue">Image</Badge>}
                      </td>
                      <td className="p-3 text-right">
                        {f.url ? (
                          <a
                            href={f.url}
                            target="_blank"
                            className="rounded-md border px-2 py-1 hover:bg-gray-50"
                          >
                            Open
                          </a>
                        ) : (
                          <button className="rounded-md border px-2 py-1 opacity-60 cursor-not-allowed">
                            No link
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {active.attachments.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-gray-500">
                        No files uploaded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs text-gray-500">Viewing only. Endorse action will be enabled later.</p>
              <button className="rounded-md bg-gray-300 text-gray-600 px-4 py-2 cursor-not-allowed" disabled>
                Endorse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
