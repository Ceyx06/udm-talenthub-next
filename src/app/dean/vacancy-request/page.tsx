"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";

type VacancyRequest = {
  id: string;
  jobTitle: string;
  college: string;
  numberOfSlots: number;
  targetStartDate: string; // ISO string from API
  minimumQualifications: string;
  justification: string;
  status: "Pending" | "Approved" | "Declined" | string;
  submittedAt: string;
};

const COLLEGES = ["CAS", "CHS", "CBPM", "CCJ", "CED", "CCS"] as const;

export default function Page() {
  const [form, setForm] = useState({
    jobTitle: "",
    college: "CAS",
    numberOfSlots: "1",
    targetStartDate: "",
    minimumQualifications: "",
    justification: "",
  });

  const [requests, setRequests] = useState<VacancyRequest[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  /* ------------ Load Previous Requests on mount ------------ */
  useEffect(() => {
    const fetchRequests = async () => {
      setLoadingRequests(true);
      try {
        const res = await fetch("/api/dean/vacancy-request", {
          cache: "no-store",
        });
        const text = await res.text();
        let data: VacancyRequest[] = [];
        try {
          data = text ? JSON.parse(text) : [];
        } catch {
          console.error("Non-JSON response from /api/dean/vacancy-request:", text);
        }

        if (res.ok) {
          setRequests(data);
        } else {
          console.error(
            "Failed to load vacancy requests",
            res.status,
            text || data
          );
        }
      } catch (err) {
        console.error("Error loading vacancy requests", err);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchRequests();
  }, []);

  /* ------------ Helpers ------------ */
  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const statusBadgeClass = (status: VacancyRequest["status"]) => {
    if (status === "Approved") {
      return "bg-green-100 text-green-700";
    }
    if (status === "Declined") {
      return "bg-red-100 text-red-700";
    }
    // Pending / default
    return "bg-yellow-100 text-yellow-800";
  };

  /* ------------ Submit Request ------------ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.jobTitle || !form.targetStartDate || !form.numberOfSlots) {
      alert("Please fill in Job Title, Number of Slots, and Target Start Date.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/dean/vacancy-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: form.jobTitle,
          college: form.college,
          numberOfSlots: Number(form.numberOfSlots),
          targetStartDate: form.targetStartDate, // "YYYY-MM-DD"
          minimumQualifications: form.minimumQualifications,
          justification: form.justification,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        console.error(
          "Failed to submit vacancy request",
          res.status,
          text || "(empty response)"
        );
        alert("Failed to submit vacancy request.");
        return;
      }

      let created: VacancyRequest;
      try {
        created = JSON.parse(text);
      } catch {
        console.error("Invalid JSON returned from POST /api/dean/vacancy-request:", text);
        alert("Server returned an invalid response.");
        return;
      }

      // Add new request to top of list
      setRequests((prev) => [created, ...prev]);

      // Reset form
      setForm({
        jobTitle: "",
        college: "CAS",
        numberOfSlots: "1",
        targetStartDate: "",
        minimumQualifications: "",
        justification: "",
      });

      alert("Vacancy request submitted to HR.");
    } catch (err) {
      console.error("Error submitting vacancy request", err);
      alert("Something went wrong while submitting.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Vacancy Request"
        subtitle="Submit a new position request to HR"
      />

      {/* Form card */}
      <div className="rounded-xl border bg-white p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Job Title</label>
              <input
                name="jobTitle"
                value={form.jobTitle}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border p-2"
                placeholder="e.g., Associate Professor"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">College</label>
              <select
                name="college"
                value={form.college}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border p-2"
              >
                {COLLEGES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600">Number of Slots</label>
              <input
                name="numberOfSlots"
                type="number"
                min={1}
                value={form.numberOfSlots}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border p-2"
                placeholder="e.g., 2"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Target Start Date</label>
              <input
                name="targetStartDate"
                type="date"
                value={form.targetStartDate}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border p-2"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">
                Minimum Qualifications
              </label>
              <textarea
                name="minimumQualifications"
                value={form.minimumQualifications}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border p-2"
                rows={4}
                placeholder="List required qualifications, education, and experience..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Justification</label>
              <textarea
                name="justification"
                value={form.justification}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border p-2"
                rows={4}
                placeholder="Explain why this position is needed..."
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-900 text-white px-4 py-2 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>

            <button
              type="button"
              className="rounded-md border px-4 py-2 text-gray-700"
              onClick={() => {
                // simple placeholder behavior for "Save Draft"
                alert("Save Draft is not yet connected to backend.");
              }}
            >
              Save Draft
            </button>
          </div>
        </form>
      </div>

      {/* Previous Requests */}
      <div className="rounded-xl border bg-white p-4">
        <div className="font-medium mb-3">Previous Requests</div>

        {loadingRequests ? (
          <div className="text-sm text-gray-500">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-sm text-gray-500">
            No vacancy requests submitted yet.
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <div className="font-medium">{req.jobTitle}</div>
                  <div className="text-xs text-gray-500">
                    {req.college} • Submitted on{" "}
                    {req.submittedAt
                      ? new Date(req.submittedAt).toLocaleDateString()
                      : "-"}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(
                    req.status
                  )}`}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
