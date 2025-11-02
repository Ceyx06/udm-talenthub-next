"use client";

import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";

type Stage = "Applied" | "Screening" | "Interview" | "Offer" | "Rejected";
type Status = "Pending" | "Reviewed" | "Shortlisted" | "Hired" | "Rejected";

type Application = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  contactNo: string | null;
  resumeUrl: string;
  coverLetter: string;
  status: Status;
  stage: Stage;
  appliedDate: string;
  endorsedDate: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  dob: string | null;
  gender: string | null;
  civilStatus: string | null;
  presentAddress: string | null;
  permanentAddress: string | null;
  nationality: string | null;
  idType: string | null;
  idNumber: string | null;
  desiredPosition: string | null;
  department: string | null;
  employmentType: string | null;
  highestDegree: string | null;
  trainingHours: string | null;
  licenseName: string | null;
  licenseNo: string | null;
  licenseExpiry: string | null;
  experiences: any;
  references: any;
  signature: string | null;
  qrCode: string | null;
  vacancy: {
    title: string;
    college: string;
  };
};

type Row = {
  id: string;
  name: string;
  email: string;
  job: string;
  college: string;
  phone: string;
  filesComplete: boolean;
  stage: Stage;
  status: Status;
  endorsed: boolean;
  attachments: { name: string; type: "pdf" | "image"; url?: string }[];
  rawData: Application;
};

const canManageFiles = true;

export default function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endorsing, setEndorsing] = useState<string | null>(null);

  // View modal state
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Row | null>(null);

  // Fetch applications from API
  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/applications');

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const applications: Application[] = await response.json();

      // Transform API data to Row format
      const transformedRows: Row[] = applications.map((app) => {
        const attachments: { name: string; type: "pdf" | "image"; url?: string }[] = [];

        // Add resume if exists
        if (app.resumeUrl) {
          attachments.push({
            name: "Resume.pdf",
            type: "pdf",
            url: app.resumeUrl
          });
        }

        // Add signature if exists
        if (app.signature) {
          attachments.push({
            name: "Signature.png",
            type: "image",
            url: app.signature
          });
        }

        return {
          id: app.id,
          name: app.fullName,
          email: app.email,
          job: app.vacancy?.title || app.desiredPosition || "N/A",
          college: app.vacancy?.college || app.department || "N/A",
          phone: app.phone || app.contactNo || "N/A",
          filesComplete: attachments.length >= 2,
          stage: app.stage,
          status: app.status,
          endorsed: !!app.endorsedDate,
          attachments,
          rawData: app
        };
      });

      setRows(transformedRows);
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }

  const data = useMemo(() => rows, [rows]);

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

  async function handleEndorse(r: Row) {
    if (!confirm(`Endorse ${r.name}'s application to the Dean?`)) return;

    try {
      setEndorsing(r.id);

      const response = await fetch(`/api/applications/${r.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'endorse' }),
      });

      if (!response.ok) {
        throw new Error('Failed to endorse application');
      }

      // Update local state
      setRows((prev) =>
        prev.map((row) =>
          row.id === r.id
            ? { ...row, endorsed: true, status: 'Reviewed' as Status }
            : row
        )
      );

      // Update active modal if open
      if (active && active.id === r.id) {
        setActive({
          ...active,
          endorsed: true,
          status: 'Reviewed' as Status,
          rawData: {
            ...active.rawData,
            endorsedDate: new Date().toISOString(),
            status: 'Reviewed' as Status
          }
        });
      }

      alert('Application endorsed successfully! Dean can now view it.');
    } catch (err: any) {
      console.error('Error endorsing application:', err);
      alert('Failed to endorse application: ' + err.message);
    } finally {
      setEndorsing(null);
    }
  }

  async function handleDelete(r: Row) {
    if (!confirm(`Delete applicant ${r.id} — ${r.name}?`)) return;

    try {
      const response = await fetch(`/api/applications/${r.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete application');
      }

      // Remove from local state
      setRows((prev) => prev.filter((row) => row.id !== r.id));

      // Close modal if this application was open
      if (active && active.id === r.id) {
        closeViewer();
      }

      alert('Application deleted successfully');
    } catch (err: any) {
      console.error('Error deleting application:', err);
      alert('Failed to delete application: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Applicants" subtitle="Track and manage job applicants" />
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-gray-500">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Applicants" subtitle="Track and manage job applicants" />
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchApplications}
            className="rounded-md bg-blue-900 text-white px-4 py-2 hover:bg-blue-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Applicants" subtitle="Track and manage job applicants" />
        <button
          onClick={fetchApplications}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

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
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Stage</th>
                <th className="p-3 font-medium">Endorsed</th>
                <th className="p-3 text-right font-medium w-48">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50/60">
                  <td className="p-3 font-mono text-xs">{r.id.slice(0, 8)}</td>
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">{r.job}</td>
                  <td className="p-3">
                    <Badge tone="gray">{r.college}</Badge>
                  </td>
                  <td className="p-3">{r.phone}</td>

                  {/* Clickable Files status */}
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

                  {/* Status */}
                  <td className="p-3">
                    {r.status === "Pending" && <Badge tone="gray">Pending</Badge>}
                    {r.status === "Reviewed" && <Badge tone="blue">Reviewed</Badge>}
                    {r.status === "Shortlisted" && <Badge tone="purple">Shortlisted</Badge>}
                    {r.status === "Hired" && <Badge tone="green">Hired</Badge>}
                    {r.status === "Rejected" && <Badge tone="red">Rejected</Badge>}
                  </td>

                  {/* Stage */}
                  <td className="p-3">
                    {r.stage === "Applied" && <Badge tone="gray">Applied</Badge>}
                    {r.stage === "Screening" && <Badge tone="blue">Screening</Badge>}
                    {r.stage === "Interview" && <Badge tone="purple">Interview</Badge>}
                    {r.stage === "Offer" && <Badge tone="green">Offer</Badge>}
                    {r.stage === "Rejected" && <Badge tone="red">Rejected</Badge>}
                  </td>

                  {/* Endorsed status */}
                  <td className="p-3">
                    {r.endorsed ? (
                      <Badge tone="green">Yes</Badge>
                    ) : (
                      <Badge tone="gray">No</Badge>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-3">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => handleDelete(r)}
                        className="text-red-600 hover:underline text-xs"
                        title="Delete"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => openViewer(r)}
                        className="rounded-md bg-blue-900 text-white px-3 py-1.5 hover:bg-blue-800 text-xs"
                        title="View details"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {data.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-gray-500">
                    No applicants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW MODAL */}
      {open && active && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={closeViewer}
        >
          <div
            className="w-full max-w-3xl rounded-xl border bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold">Applicant Details</h3>
                <p className="text-sm text-gray-500">
                  {active.id.slice(0, 8)} • {active.name}
                </p>
              </div>
              <button
                onClick={closeViewer}
                className="rounded-md border px-3 py-1 hover:bg-gray-50"
              >
                ✕
              </button>
            </div>

            {/* Personal Information */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-3">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium">{active.rawData.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <p className="font-medium">{active.phone}</p>
                </div>
                {active.rawData.dob && (
                  <div>
                    <span className="text-gray-500">Date of Birth:</span>
                    <p className="font-medium">{new Date(active.rawData.dob).toLocaleDateString()}</p>
                  </div>
                )}
                {active.rawData.gender && (
                  <div>
                    <span className="text-gray-500">Gender:</span>
                    <p className="font-medium">{active.rawData.gender}</p>
                  </div>
                )}
                {active.rawData.civilStatus && (
                  <div>
                    <span className="text-gray-500">Civil Status:</span>
                    <p className="font-medium">{active.rawData.civilStatus}</p>
                  </div>
                )}
                {active.rawData.nationality && (
                  <div>
                    <span className="text-gray-500">Nationality:</span>
                    <p className="font-medium">{active.rawData.nationality}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Address Information */}
            {(active.rawData.presentAddress || active.rawData.permanentAddress) && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3">Address</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {active.rawData.presentAddress && (
                    <div>
                      <span className="text-gray-500">Present Address:</span>
                      <p className="font-medium">{active.rawData.presentAddress}</p>
                    </div>
                  )}
                  {active.rawData.permanentAddress && (
                    <div>
                      <span className="text-gray-500">Permanent Address:</span>
                      <p className="font-medium">{active.rawData.permanentAddress}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Application Status */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-3">Application Status</h4>
              <div className="flex gap-4">
                <div>
                  <span className="text-xs text-gray-500">Status:</span>
                  <div className="mt-1">
                    {active.status === "Pending" && <Badge tone="gray">Pending</Badge>}
                    {active.status === "Reviewed" && <Badge tone="blue">Reviewed</Badge>}
                    {active.status === "Shortlisted" && <Badge tone="purple">Shortlisted</Badge>}
                    {active.status === "Hired" && <Badge tone="green">Hired</Badge>}
                    {active.status === "Rejected" && <Badge tone="red">Rejected</Badge>}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Stage:</span>
                  <div className="mt-1">
                    {active.stage === "Applied" && <Badge tone="gray">Applied</Badge>}
                    {active.stage === "Screening" && <Badge tone="blue">Screening</Badge>}
                    {active.stage === "Interview" && <Badge tone="purple">Interview</Badge>}
                    {active.stage === "Offer" && <Badge tone="green">Offer</Badge>}
                    {active.stage === "Rejected" && <Badge tone="red">Rejected</Badge>}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Files Status:</span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${active.filesComplete
                          ? "bg-green-100 text-green-800 ring-green-300"
                          : "bg-red-100 text-red-800 ring-red-300"
                        }`}
                    >
                      {active.filesComplete ? "Complete" : "Partial"}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Endorsed:</span>
                  <div className="mt-1">
                    {active.endorsed ? (
                      <Badge tone="green">Yes</Badge>
                    ) : (
                      <Badge tone="gray">No</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Files/Attachments */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-3">Attachments</h4>
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr className="text-gray-700">
                      <th className="p-3 font-medium">File name</th>
                      <th className="p-3 font-medium">Type</th>
                      <th className="p-3 font-medium text-right w-24">Action</th>
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
                              rel="noopener noreferrer"
                              className="rounded-md border px-2 py-1 hover:bg-gray-50 inline-block"
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
            </div>

            {/* Cover Letter */}
            {active.rawData.coverLetter && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3">Cover Letter</h4>
                <div className="rounded-lg border p-4 bg-gray-50 text-sm">
                  <p className="whitespace-pre-wrap">{active.rawData.coverLetter}</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t">
              <button
                onClick={closeViewer}
                className="rounded-md border px-4 py-2 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => handleEndorse(active)}
                disabled={active.endorsed || endorsing === active.id}
                className={`rounded-md px-4 py-2 ${active.endorsed
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                title={active.endorsed ? "Already endorsed" : "Endorse to Dean"}
              >
                {endorsing === active.id ? "Endorsing..." : active.endorsed ? "Already Endorsed" : "Endorse to Dean"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}