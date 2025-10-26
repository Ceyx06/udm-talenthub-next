"use client";

import { useState, useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";
// import axios from "axios"; // uncomment when API routes are ready

type Stage = "Pending" | "Conducted" | "Evaluating";

type Row = {
  id: string;
  name: string;
  email: string;
  job: string;
  college: "CAS" | "CHS" | "CBPM" | string;
  phone: string;
  filesComplete: boolean; // true=Complete, false=Partial
  stage: Stage;
  attachments: { name: string; type: "pdf" | "image"; url?: string }[];
  endorsedAt?: string | null;
};

const canManageFiles = true;

const initialRows: Row[] = [
  {
    id: "APP001",
    name: "Juan Dela Cruz",
    email: "juan.delacruz@email.com",
    job: "Assistant Professor – Mathematics",
    college: "CAS",
    phone: "+63 912 345 6789",
    filesComplete: true,
    stage: "Pending",
    attachments: [
      { name: "CV_JuanDelaCruz.pdf", type: "pdf" },
      { name: "TOR_Juan.jpg", type: "image" },
      { name: "PRC_License.pdf", type: "pdf" },
    ],
    endorsedAt: null,
  },
  {
    id: "APP002",
    name: "Maria Santos",
    email: "maria.santos@email.com",
    job: "Instructor – Nursing",
    college: "CHS",
    phone: "+63 923 456 7890",
    filesComplete: false,
    stage: "Pending",
    attachments: [
      { name: "CV_MariaSantos.pdf", type: "pdf" },
      { name: "TOR_Maria.jpg", type: "image" },
    ],
    endorsedAt: null,
  },
  {
    id: "APP003",
    name: "Pedro Reyes",
    email: "pedro.reyes@email.com",
    job: "Associate Professor – Business Management",
    college: "CBPM",
    phone: "+63 934 567 8901",
    filesComplete: false,
    stage: "Pending",
    attachments: [
      { name: "CV_PedroReyes.pdf", type: "pdf" },
      { name: "TOR_Pedro.png", type: "image" },
      { name: "COC_Pedro.pdf", type: "pdf" },
    ],
    endorsedAt: null,
  },
];

export default function Page() {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Row | null>(null);
  const data = useMemo(() => rows, [rows]);

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
  }

  // Toggle ONLY from the modal
  async function toggleFilesFromModal() {
    if (!active || !canManageFiles) return;

    const targetId = active.id;
    const nextValue = !active.filesComplete;

    // optimistic update: modal + table row
    setActive({ ...active, filesComplete: nextValue });
    setRows((prev) =>
      prev.map((row) =>
        row.id === targetId ? { ...row, filesComplete: nextValue } : row
      )
    );

    // Optional: persist to server
    // try {
    //   await axios.patch(`/api/hr/applicants/${targetId}/files-status`, {
    //     filesComplete: nextValue,
    //   });
    // } catch (e) {
    //   // rollback on failure
    //   setActive({ ...active, filesComplete: !nextValue });
    //   setRows((prev) =>
    //     prev.map((row) =>
    //       row.id === targetId ? { ...row, filesComplete: !nextValue } : row
    //     )
    //   );
    //   alert("Failed to update files status on server.");
    // }
  }

  async function endorseActive() {
    if (!active) return;
    const nowISO = new Date().toISOString();

    setRows((prev) =>
      prev.map((row) => (row.id === active.id ? { ...row, endorsedAt: nowISO } : row))
    );
    setActive({ ...active, endorsedAt: nowISO });

    // try {
    //   await axios.post(`/api/hr/applicants/${active.id}/endorse`);
    // } catch {
    //   setRows((prev) =>
    //     prev.map((row) => (row.id === active.id ? { ...row, endorsedAt: null } : row))
    //   );
    //   setActive({ ...active, endorsedAt: null });
    //   alert("Failed to endorse on server.");
    // }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Applicants" subtitle="Track and manage job applicants" />

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
                <th className="p-3 font-medium">Endorsed</th>
                <th className="p-3 text-right font-medium w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50/60">
                  <td className="p-3">{r.id}</td>
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">{r.job}</td>
                  <td className="p-3">
                    <Badge tone="gray">{r.college}</Badge>
                  </td>
                  <td className="p-3">{r.phone}</td>

                  {/* Files column: READ-ONLY. Reflects changes made in modal */}
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                        r.filesComplete
                          ? "bg-green-100 text-green-800 ring-green-300"
                          : "bg-red-100 text-red-800 ring-red-300"
                      }`}
                      title="Editable in View"
                    >
                      {r.filesComplete ? "Complete" : "Partial"}
                    </span>
                  </td>

                  {/* Stage: keep all Pending for now */}
                  <td className="p-3">
                    <Badge tone="gray">Pending</Badge>
                  </td>

                  <td className="p-3">
                    {r.endorsedAt ? (
                      <span className="text-xs text-green-700">
                        Endorsed<br />{new Date(r.endorsedAt).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">—</span>
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

              {data.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-gray-500">
                    No applicants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW MODAL (only place where Files can be toggled) */}
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

            {/* Single toggle pill INSIDE the modal */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-gray-500">Files Status:</span>
              <button
                onClick={toggleFilesFromModal}
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                  active.filesComplete
                    ? "bg-green-100 text-green-800 ring-green-300"
                    : "bg-red-100 text-red-800 ring-red-300"
                } ${!canManageFiles ? "cursor-not-allowed opacity-60" : "hover:opacity-90"}`}
                disabled={!canManageFiles}
                title="Click to toggle files status"
              >
                {active.filesComplete ? "Complete" : "Partial"}
              </button>
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
              <p className="text-xs text-gray-500">
                {active.endorsedAt
                  ? "Already endorsed."
                  : "Endorse to forward this applicant to the Dean portal."}
              </p>
              <button
                onClick={endorseActive}
                className={`rounded-md px-4 py-2 ${
                  active.endorsedAt
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
                title={active.endorsedAt ? "Already endorsed" : "Endorse applicant"}
                disabled={!!active.endorsedAt}
              >
                {active.endorsedAt ? "Endorsed" : "Endorse"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
