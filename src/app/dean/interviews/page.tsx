"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";

type Status = "Pending" | "Scheduled" | "Completed";

type Row = {
  id: string;
  name: string;
  job: string;
  interview: string; // YYYY-MM-DD or "-"
  demo: string;      // YYYY-MM-DD or "-"
  status: Status;
};

const initialRows: Row[] = [
  { id: "A001", name: "Juan Dela Cruz", job: "Associate Professor", interview: "2024-02-15", demo: "2024-02-20", status: "Scheduled" },
  { id: "A002", name: "Maria Santos", job: "Instructor",            interview: "-",             demo: "-",             status: "Pending" },
  { id: "A003", name: "Pedro Garcia",  job: "Assistant Professor",  interview: "2024-02-10", demo: "2024-02-12", status: "Completed" },
];

function fmt(date: string) {
  if (!date || date === "-") return "—";
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// Pills like in the screenshot (keeps your 3 options only)
function StatusPill({ status }: { status: Status }) {
  if (status === "Pending") {
    return (
      <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
        Pending
      </span>
    );
  }
  if (status === "Scheduled") {
    return (
      <span className="inline-flex items-center rounded-full border border-blue-300 bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
        Scheduled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-green-300 bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
      Completed
    </span>
  );
}

export default function Page() {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [q, setQ] = useState("");

  // schedule modal state
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [interviewDate, setInterviewDate] = useState<string>("");
  const [demoDate, setDemoDate] = useState<string>("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.id.toLowerCase().includes(term) ||
        r.name.toLowerCase().includes(term) ||
        r.job.toLowerCase().includes(term)
    );
  }, [q, rows]);

  // open schedule dialog for a row
  function openSchedule(row: Row) {
    setActiveId(row.id);
    setInterviewDate(row.interview !== "-" ? row.interview : "");
    setDemoDate(row.demo !== "-" ? row.demo : "");
    setOpen(true);
  }

  function closeSchedule() {
    setOpen(false);
    setActiveId(null);
    setInterviewDate("");
    setDemoDate("");
  }

  // save schedule -> sets dates and flips status to Scheduled
  function saveSchedule() {
    if (!activeId) return;
    if (!interviewDate || !demoDate) {
      // very light validation; you can toast here
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === activeId
          ? { ...r, interview: interviewDate, demo: demoDate, status: "Scheduled" }
          : r
      )
    );
    closeSchedule();
  }

  function markComplete(row: Row) {
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, status: "Completed" } : r))
    );
  }

  function markUncomplete(row: Row) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id ? { ...r, status: "Pending", interview: "-", demo: "-" } : r
      )
    );
  }

  function endorsed(/* row: Row */) {
    // hook this to your endorse/forward flow
    // e.g., router.push(`/dean/endorse/${row.id}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interview & Teaching Demo"
        subtitle="Schedule and manage interviews"
      />

      {/* Top search like in your mock */}
      <div className="rounded-xl border bg-white p-4">
        <div className="relative sm:w-96">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search applicants…"
            className="w-full rounded-lg border px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            ⌘K
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr className="text-gray-700">
                <th className="p-3 font-medium">Applicant ID</th>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Job Title</th>
                <th className="p-3 font-medium">Interview Date</th>
                <th className="p-3 font-medium">Teaching Demo Date</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 text-right font-medium w-64">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50/60">
                  <td className="p-3">{r.id}</td>
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.job}</td>
                  <td className="p-3">{fmt(r.interview)}</td>
                  <td className="p-3">{fmt(r.demo)}</td>
                  <td className="p-3">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      {r.status === "Pending" && (
                        <button
                          onClick={() => openSchedule(r)}
                          className="rounded-md bg-blue-900 text-white px-3 py-1.5 hover:bg-blue-800"
                        >
                          Set Schedule
                        </button>
                      )}

                      {r.status === "Scheduled" && (
                        <>
                          <button
                            onClick={() => markComplete(r)}
                            className="rounded-md bg-blue-900 text-white px-3 py-1.5 hover:bg-blue-800"
                          >
                            Mark Complete
                          </button>
                          <button
                            onClick={() => markUncomplete(r)}
                            className="rounded-md border px-3 py-1.5 hover:bg-gray-50"
                          >
                            Mark Uncomplete
                          </button>
                        </>
                      )}

                      {r.status === "Completed" && (
                        <button
                          onClick={() => endorsed()}
                          className="rounded-md bg-blue-900 text-white px-3 py-1.5 hover:bg-blue-800"
                        >
                          Endorsed
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simple calendar modal (Interview + Demo) */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={closeSchedule}
        >
          <div
            className="w-full max-w-md rounded-xl border bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold">Set Schedule</h3>
            <p className="mt-1 text-sm text-gray-500">
              Choose the Interview Date and Teaching Demo Date.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-gray-700">Interview Date</span>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </label>

              <label className="block text-sm">
                <span className="text-gray-700">Teaching Demo Date</span>
                <input
                  type="date"
                  value={demoDate}
                  onChange={(e) => setDemoDate(e.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeSchedule}
                className="rounded-md border px-3 py-1.5 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveSchedule}
                className="rounded-md bg-blue-900 text-white px-4 py-1.5 hover:bg-blue-800 disabled:opacity-50"
                disabled={!interviewDate || !demoDate}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
