"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";
import ScheduleInterviewModal from "@/components/ScheduleInterviewModal";

type Stage = "Applied" | "Screening" | "Interview" | "Offer" | "Rejected";
type Status = "Pending" | "Reviewed" | "Shortlisted" | "Hired" | "Rejected";
type FileItem = { name: string; type: "pdf" | "image"; url?: string };

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
  desiredPosition: string | null;
  department: string | null;
  highestDegree: string | null;
  signature: string | null;
  qrCode: string | null;
  vacancy?: {
    title?: string;
    college?: string;
  } | null;
  interviews?: any[];
};

type Row = {
  id: string;
  name: string;
  job: string;
  files: "Complete" | "Partial";
  stage: Stage;
  status: Status;
  endorsed: string;
  attachments: FileItem[];
  rawData: Application;
  hasInterview: boolean;
};

export default function Page() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Row | null>(null);

  // Interview modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  useEffect(() => {
    fetchEndorsedApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchEndorsedApplications() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/applications?endorsed=true");
      if (!response.ok) throw new Error("Failed to fetch applications");

      const applications: Application[] = await response.json();

      const transformedRows: Row[] = applications.map((app) => {
        const attachments: FileItem[] = [];

        if (app.resumeUrl) {
          attachments.push({
            name: "Resume.pdf",
            type: "pdf",
            url: app.resumeUrl,
          });
        }
        if (app.signature) {
          attachments.push({
            name: "Signature.png",
            type: "image",
            url: app.signature,
          });
        }

        const safeStage: Stage = (app.stage ?? "Applied") as Stage;
        const safeStatus: Status = (app.status ?? "Pending") as Status;

        return {
          id: app.id,
          name: app.fullName,
          job: app.vacancy?.title || app.desiredPosition || "N/A",
          files: attachments.length >= 2 ? "Complete" : "Partial",
          stage: safeStage,
          status: safeStatus,
          endorsed: app.endorsedDate
            ? new Date(app.endorsedDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
            : "-",
          attachments,
          rawData: app,
          hasInterview: Array.isArray(app.interviews) && app.interviews.length > 0,
        };
      });

      setRows(transformedRows);
    } catch (err: any) {
      console.error("Error fetching endorsed applications:", err);
      setError(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  function openViewer(r: Row) {
    setActive(r);
    setOpen(true);
  }

  function closeViewer() {
    setOpen(false);
    setActive(null);
  }

  function handleScheduleInterview(application: Application) {
    setSelectedApplication(application);
    setIsScheduleModalOpen(true);
  }

  async function onScheduleInterview(data: {
    applicationId: string;
    interviewDate: string;
    teachingDemoDate: string;
  }) {
    try {
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: data.applicationId,
          interviewDate: data.interviewDate,
          teachingDemoDate: data.teachingDemoDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to schedule interview');
      }

      // Refresh applications list
      await fetchEndorsedApplications();

      // Show success message
      alert('Interview scheduled successfully!');
    } catch (error: any) {
      console.error('Failed to schedule interview:', error);
      alert(error.message || 'Failed to schedule interview. Please try again.');
      throw error;
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="View Applicants" subtitle="Review applicant files" />
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-gray-500">Loading endorsed applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="View Applicants" subtitle="Review applicant files" />
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchEndorsedApplications}
            className="rounded-md bg-blue-900 text-white px-4 py-2 hover:bg-blue-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader title="View Applicants" subtitle="Review applicant files" />
        <button
          onClick={fetchEndorsedApplications}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Applicant ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Job Title</th>
              <th className="p-3">Files</th>
              <th className="p-3">Status</th>
              <th className="p-3">Stage</th>
              <th className="p-3">Endorsed Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-mono text-xs">
                  {r.rawData.qrCode || r.id.slice(0, 8)}
                </td>
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
                  {r.status === "Pending" && <Badge tone="gray">Pending</Badge>}
                  {r.status === "Reviewed" && <Badge tone="blue">Reviewed</Badge>}
                  {r.status === "Shortlisted" && (
                    <Badge tone="purple">Shortlisted</Badge>
                  )}
                  {r.status === "Hired" && <Badge tone="green">Hired</Badge>}
                  {r.status === "Rejected" && <Badge tone="red">Rejected</Badge>}
                </td>
                <td className="p-3">
                  {r.stage === "Applied" && <Badge tone="gray">Applied</Badge>}
                  {r.stage === "Screening" && <Badge tone="blue">Screening</Badge>}
                  {r.stage === "Interview" && (
                    <Badge tone="purple">Interview</Badge>
                  )}
                  {r.stage === "Offer" && <Badge tone="green">Offer</Badge>}
                  {r.stage === "Rejected" && <Badge tone="red">Rejected</Badge>}
                </td>
                <td className="p-3">{r.endorsed}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openViewer(r)}
                      className="rounded-md border px-3 py-1 hover:bg-gray-50 text-xs"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleScheduleInterview(r.rawData)}
                      disabled={r.hasInterview}
                      className={`rounded-md px-3 py-1.5 text-xs ${r.hasInterview
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-900 text-white hover:bg-blue-800'
                        }`}
                    >
                      {r.hasInterview ? 'Interview Scheduled' : 'Schedule Interview'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  No endorsed applicants yet. HR needs to endorse applications first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW FILES MODAL */}
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
                  {active.rawData.qrCode || active.id.slice(0, 8)} • {active.name}
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
                  <p className="font-medium">
                    {active.rawData.phone || active.rawData.contactNo || "N/A"}
                  </p>
                </div>
                {active.rawData.dob && (
                  <div>
                    <span className="text-gray-500">Date of Birth:</span>
                    <p className="font-medium">
                      {new Date(active.rawData.dob).toLocaleDateString()}
                    </p>
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
                    {active.status === "Shortlisted" && (
                      <Badge tone="purple">Shortlisted</Badge>
                    )}
                    {active.status === "Hired" && <Badge tone="green">Hired</Badge>}
                    {active.status === "Rejected" && <Badge tone="red">Rejected</Badge>}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Stage:</span>
                  <div className="mt-1">
                    {active.stage === "Applied" && <Badge tone="gray">Applied</Badge>}
                    {active.stage === "Screening" && <Badge tone="blue">Screening</Badge>}
                    {active.stage === "Interview" && (
                      <Badge tone="purple">Interview</Badge>
                    )}
                    {active.stage === "Offer" && <Badge tone="green">Offer</Badge>}
                    {active.stage === "Rejected" && <Badge tone="red">Rejected</Badge>}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Endorsed:</span>
                  <div className="mt-1">
                    <Badge tone="blue">{active.endorsed}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Files */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-3">Submitted Files</h4>
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
                          {f.type === "pdf" ? (
                            <Badge tone="gray">PDF</Badge>
                          ) : (
                            <Badge tone="blue">Image</Badge>
                          )}
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

            <div className="flex justify-between pt-4 border-t">
              <button
                onClick={closeViewer}
                className="rounded-md border px-4 py-2 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  closeViewer();
                  handleScheduleInterview(active.rawData);
                }}
                disabled={active.hasInterview}
                className={`rounded-md px-4 py-2 ${active.hasInterview
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-900 text-white hover:bg-blue-800'
                  }`}
              >
                {active.hasInterview ? 'Interview Already Scheduled' : 'Schedule Interview'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      {selectedApplication && (
        <ScheduleInterviewModal
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setSelectedApplication(null);
          }}
          application={{
            id: selectedApplication.id,
            applicationId: selectedApplication.qrCode || selectedApplication.id.slice(0, 8),
            name: selectedApplication.fullName,
            jobTitle: selectedApplication.desiredPosition || selectedApplication.vacancy?.title || 'N/A',
          }}
          onSchedule={onScheduleInterview}
        />
      )}
    </div>
  );
}