"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";

type FacultyRow = {
  name: string;
  college: "CAS" | "CHS" | "CBPM" | "CCJ" | "CED" | "CCS" | string;
  position: string;
  type: "Full-time" | "Part-time" | string;
  status: "Active" | "Inactive";
};

const rows: FacultyRow[] = [
  { name: "Dr. Ana Lopez",     college: "CAS",  position: "Professor",            type: "Full-time", status: "Active" },
  { name: "Prof. Carlos Reyes", college: "CHS",  position: "Associate Professor",  type: "Part-time", status: "Active" },
  { name: "Ms. Elena Cruz",     college: "CBPM", position: "Instructor",          type: "Full-time", status: "Inactive" },
  { name: "Dr. Roberto Tan",    college: "CCJ",  position: "Professor",            type: "Full-time", status: "Active" },
  { name: "Prof. Isabel Mendoza",college: "CED", position: "Assistant Professor",  type: "Part-time", status: "Active" },
  { name: "Dr. Miguel Santos",  college: "CCS",  position: "Professor",            type: "Full-time", status: "Active" },
];

// ---- Mock Applicants (local-only) ----
type Applicant = {
  name: string;
  email: string;
  job: string;
  college: string;
  phone: string;
  files: "Complete" | "Partial";
  stage: "Pending" | "Conducted" | "Evaluating";
};

export default function Page() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<Applicant>({
    name: "",
    email: "",
    job: "",
    college: "",
    phone: "",
    files: "Complete",
    stage: "Pending",
  });

  function resetForm() {
    setForm({
      name: "",
      email: "",
      job: "",
      college: "",
      phone: "",
      files: "Complete",
      stage: "Pending",
    });
  }

  function exportFacultyCSV() {
    const headers = ["Faculty Name", "College", "Position", "Type", "Status"];
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          `"${r.name}"`,
          `"${r.college}"`,
          `"${r.position}"`,
          `"${r.type}"`,
          `"${r.status}"`,
        ].join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "faculty_mock.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function onSubmitMockApplicant(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    // minimal validation for mock
    if (!form.name || !form.email || !form.job || !form.college) {
      setErr("Please fill in name, email, job, and college.");
      return;
    }

    setApplicants((prev) => [{ ...form }, ...prev]);
    resetForm();
    setShowForm(false);
  }

  const hasApplicants = applicants.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader title="Faculty" subtitle="View all faculty members" />
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-md bg-blue-600 text-white px-3 py-2"
          >
            {showForm ? "Close Applicant Form" : "Add Applicant (mock)"}
          </button>
          <button
            onClick={exportFacultyCSV}
            className="rounded-md bg-blue-900 text-white px-3 py-2"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Faculty Table (mock) */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Faculty Name</th>
              <th className="p-3">College</th>
              <th className="p-3">Position</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t">
                <td className="p-3">{r.name}</td>
                <td className="p-3">
                  <Badge tone="gray">{r.college}</Badge>
                </td>
                <td className="p-3">{r.position}</td>
                <td className="p-3">{r.type}</td>
                <td className="p-3">
                  {r.status === "Active" ? (
                    <Badge tone="green">Active</Badge>
                  ) : (
                    <Badge tone="gray">Inactive</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mock Applicant Form */}
      {showForm && (
        <form
          onSubmit={onSubmitMockApplicant}
          className="rounded-xl border bg-white p-4 space-y-4"
        >
          <h2 className="text-base font-semibold">Add Applicant (mock only)</h2>
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              required
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              required
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Position applied (Job)"
              value={form.job}
              onChange={(e) => setForm((s) => ({ ...s, job: e.target.value }))}
              required
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="College (e.g., CAS/CHS/CBPM/CCJ/CED/CCS)"
              value={form.college}
              onChange={(e) => setForm((s) => ({ ...s, college: e.target.value }))}
              required
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
            />
            <select
              className="border rounded-lg px-3 py-2"
              value={form.files}
              onChange={(e) =>
                setForm((s) => ({ ...s, files: e.target.value as Applicant["files"] }))
              }
              title="Files completeness"
            >
              <option value="Complete">Files: Complete</option>
              <option value="Partial">Files: Partial</option>
            </select>

            <select
              className="border rounded-lg px-3 py-2"
              value={form.stage}
              onChange={(e) =>
                setForm((s) => ({ ...s, stage: e.target.value as Applicant["stage"] }))
              }
              title="Application stage"
            >
              <option value="Pending">Stage: Pending</option>
              <option value="Conducted">Stage: Conducted</option>
              <option value="Evaluating">Stage: Evaluating</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-black text-white px-4 py-2"
            >
              Save Applicant (mock)
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="rounded-md border px-4 py-2"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Mock only: in the real flow, applicants come from the Vacancies page → Applicants table → BOR approval → Faculty.
          </p>
        </form>
      )}

      {/* Mock Applicants Table */}
      {hasApplicants && (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 font-medium">
            Recent Applicants (mock)
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Job</th>
                <th className="p-3">College</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Files</th>
                <th className="p-3">Stage</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((a, i) => (
                <tr key={`${a.email}-${i}`} className="border-t">
                  <td className="p-3">{a.name}</td>
                  <td className="p-3">{a.email}</td>
                  <td className="p-3">{a.job}</td>
                  <td className="p-3">
                    <Badge tone="gray">{a.college}</Badge>
                  </td>
                  <td className="p-3">{a.phone || "—"}</td>
                  <td className="p-3">
                    {a.files === "Complete" ? (
                      <Badge tone="green">Complete</Badge>
                    ) : (
                      <Badge tone="yellow">Partial</Badge>
                    )}
                  </td>
                  <td className="p-3">
                    {a.stage === "Pending" && <Badge tone="blue">Pending</Badge>}
                    {a.stage === "Conducted" && <Badge tone="purple">Conducted</Badge>}
                    {a.stage === "Evaluating" && <Badge tone="orange">Evaluating</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}