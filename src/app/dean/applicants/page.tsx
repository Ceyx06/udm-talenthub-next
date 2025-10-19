"use client";

import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";

type Stage = "Conducted" | "Pending" | "Evaluating";
type FileItem = { name: string; type: "pdf" | "image"; url?: string };
type Row = {
  id: string;
  name: string;
  job: string;
  files: "Complete" | "Partial";
  stage: Stage;
  endorsed: string;
  attachments: FileItem[]; // files sent by the applicant
};

const rows: Row[] = [
  {
    id: "A001",
    name: "Juan Dela Cruz",
    job: "Associate Professor",
    files: "Complete",
    stage: "Conducted",
    endorsed: "2024-01-20",
    attachments: [
      { name: "CV_JuanDelaCruz.pdf", type: "pdf" },
      { name: "TOR_Juan.jpg", type: "image" },
      { name: "PRC_License.pdf", type: "pdf" },
    ],
  },
  {
    id: "A002",
    name: "Maria Santos",
    job: "Instructor",
    files: "Partial",
    stage: "Pending",
    endorsed: "-",
    attachments: [
      { name: "CV_MariaSantos.pdf", type: "pdf" },
      { name: "TOR_Maria.jpg", type: "image" },
      // PRC missing → Partial
    ],
  },
  {
    id: "A003",
    name: "Pedro Garcia",
    job: "Assistant Professor",
    files: "Complete",
    stage: "Evaluating",
    endorsed: "-",
    attachments: [
      { name: "CV_PedroGarcia.pdf", type: "pdf" },
      { name: "COC_Pedro.png", type: "image" },
    ],
  },
];

export default function Page() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Row | null>(null);

  function openViewer(r: Row) {
    setActive(r);
    setOpen(true);
  }
  function closeViewer() {
    setOpen(false);
    setActive(null);
  }

  return (
    <div className="space-y-4">
      <PageHeader title="View Applicants" subtitle="Review applicant files" />

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Applicant ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Job Title</th>
              <th className="p-3">Files</th>
              <th className="p-3">Stage</th>
              <th className="p-3">Endorsed Date</th>
              <th className="p-3 w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.id}</td>
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.job}</td>
                <td className="p-3">
                  {r.files === "Complete" ? (
                    <Badge tone="green">Complete</Badge>
                  ) : (
                    <Badge tone="red">Partial</Badge>
                  )}
                </td>
                <td className="p-3">
                  {r.stage === "Conducted" && <Badge tone="blue">Conducted</Badge>}
                  {r.stage === "Pending" && <Badge tone="gray">Pending</Badge>}
                  {r.stage === "Evaluating" && <Badge tone="yellow">Evaluating</Badge>}
                </td>
                <td className="p-3">{r.endorsed}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => openViewer(r)}
                    className="rounded-md border px-3 py-1 hover:bg-gray-50"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW FILES MODAL (no endorse) */}
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

            <p className="mt-4 text-xs text-gray-500">
              These are the files submitted by the applicant. (Viewing only)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}