"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";

type FacultyMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  position: string;
  jobTitle: string;
  employmentType: string;
  status: string;
  ratePerHour: number;
  startDate: string;
  endDate: string;
  contractNo: string;
  createdAt: string;
};

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [allFaculty, setAllFaculty] = useState<FacultyMember[]>([]); // Store all faculty for college list
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterCollege, setFilterCollege] = useState<string>("");

  // Fetch all faculty on mount to get complete college list
  useEffect(() => {
    fetchAllFaculty();
  }, []);

  // Fetch filtered faculty whenever filters change
  useEffect(() => {
    fetchFaculty();
  }, [filterStatus, filterCollege]);

  // Fetch all faculty without filters to populate college dropdown
  async function fetchAllFaculty() {
    try {
      const response = await fetch('/api/faculty');
      const data = await response.json();
      if (data.success) {
        setAllFaculty(data.faculty);
      }
    } catch (err) {
      console.error("Error fetching all faculty:", err);
    }
  }

  async function fetchFaculty() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterCollege) params.append("college", filterCollege);

      const url = `/api/faculty?${params.toString()}`;
      console.log('=== FETCH DEBUG ===');
      console.log('URL:', url);
      console.log('Filters:', { filterStatus, filterCollege });
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('API Response:', data);
      console.log('Faculty received:', data.faculty?.length || 0);
      
      if (data.faculty && data.faculty.length > 0) {
        console.log('Sample faculty:', data.faculty[0]);
        console.log('All colleges in response:', [...new Set(data.faculty.map((f: FacultyMember) => f.college))]);
      }

      if (data.success) {
        setFaculty(data.faculty);
      } else {
        setError(data.error || "Failed to fetch faculty");
        console.error('API error:', data.error);
      }
    } catch (err) {
      console.error("Error fetching faculty:", err);
      setError("An error occurred while fetching faculty data");
    } finally {
      setLoading(false);
    }
  }

  function exportFacultyCSV() {
    if (faculty.length === 0) {
      alert("No faculty data to export");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "College",
      "Position",
      "Job Title",
      "Type",
      "Status",
      "Rate/Hour",
      "Contract No",
      "Start Date",
      "End Date",
    ];

    const rows = faculty.map((f) => [
      `"${f.name}"`,
      `"${f.email}"`,
      `"${f.phone}"`,
      `"${f.college}"`,
      `"${f.position}"`,
      `"${f.jobTitle}"`,
      `"${f.employmentType}"`,
      `"${f.status}"`,
      f.ratePerHour,
      `"${f.contractNo}"`,
      new Date(f.startDate).toLocaleDateString(),
      new Date(f.endDate).toLocaleDateString(),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `faculty_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Get unique colleges from all faculty data (unfiltered)
  const colleges = allFaculty.length > 0 
    ? [...new Set(allFaculty.map(f => f.college))].sort()
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Faculty"
          subtitle={`View all faculty members (${faculty.length} total)`}
        />
        <button
          onClick={exportFacultyCSV}
          disabled={faculty.length === 0}
          className="rounded-md bg-blue-900 text-white px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-800"
        >
          Export CSV
        </button>
      </div>

    

      {/* Filters */}
      <div className="flex gap-3 items-center bg-white p-4 rounded-lg border">
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => {
              console.log('Status filter changed to:', e.target.value);
              setFilterStatus(e.target.value);
            }}
            className="border rounded-md px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">College:</label>
          <select
            value={filterCollege}
            onChange={(e) => {
              console.log('College filter changed to:', e.target.value);
              setFilterCollege(e.target.value);
            }}
            className="border rounded-md px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            {colleges.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {(filterStatus || filterCollege) && (
          <button
            onClick={() => {
              console.log('Clearing filters');
              setFilterStatus("");
              setFilterCollege("");
            }}
            className="text-sm text-blue-600 hover:text-blue-800 ml-2"
          >
            Clear Filters
          </button>
        )}
        
        <button
          onClick={() => {
            const uniqueColleges = [...new Set(faculty.map(f => f.college))];
            console.log('Current faculty data:', faculty);
            console.log('Current filters:', { filterStatus, filterCollege });
            console.log('Unique colleges in data:', uniqueColleges);
            alert(`Colleges in database: ${uniqueColleges.join(', ') || 'None'}\n\nSet filters to "All" first to see what colleges exist.`);
          }}
          className="text-xs text-gray-500 hover:text-gray-700 ml-auto underline"
        >
          Show Data Info
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading faculty members...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error: {error}</p>
          <button
            onClick={fetchFaculty}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && faculty.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border">
          <p className="text-gray-600 text-lg">No faculty members found</p>
          <p className="text-gray-500 text-sm mt-1">
            {filterStatus || filterCollege 
              ? "Try adjusting your filters"
              : "Hired applicants with contracts will appear here"}
          </p>
          {(filterStatus || filterCollege) && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-left max-w-md mx-auto">
              <p className="text-sm font-medium text-yellow-800">Active Filters:</p>
              <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                {filterStatus && <li>Status: {filterStatus}</li>}
                {filterCollege && <li>College: {filterCollege}</li>}
              </ul>
              <p className="text-xs text-yellow-600 mt-2">
                If you see data with "All" filters but not with specific filters, 
                there may be a mismatch between filter values and database values.
              </p>
            </div>
          )}
          <p className="text-gray-400 text-xs mt-3">
            Check browser console (F12) for API response details
          </p>
          <button
            onClick={() => {
              console.log('Current filters:', { filterStatus, filterCollege });
              console.log('Faculty state:', faculty);
              fetchFaculty();
            }}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Debug & Refresh
          </button>
        </div>
      )}

      {/* Faculty Table */}
      {!loading && !error && faculty.length > 0 && (
        <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-3 font-semibold">Faculty Name</th>
                  <th className="p-3 font-semibold">Email</th>
                  <th className="p-3 font-semibold">College</th>
                  <th className="p-3 font-semibold">Position</th>
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold">Rate/Hour</th>
                  <th className="p-3 font-semibold">Contract</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {faculty.map((f) => (
                  <tr key={f.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium">{f.name}</div>
                      <div className="text-xs text-gray-500">{f.jobTitle}</div>
                    </td>
                    <td className="p-3 text-gray-600">{f.email}</td>
                    <td className="p-3">
                      <Badge tone="gray">{f.college}</Badge>
                    </td>
                    <td className="p-3">{f.position}</td>
                    <td className="p-3">
                      <Badge tone={f.employmentType === "Full-time" ? "blue" : "purple"}>
                        {f.employmentType}
                      </Badge>
                    </td>
                    <td className="p-3">₱{f.ratePerHour.toFixed(2)}</td>
                    <td className="p-3">
                      <div className="text-xs text-gray-500">{f.contractNo}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(f.startDate).toLocaleDateString()} -{" "}
                        {new Date(f.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-3">
                      {f.status === "Active" && <Badge tone="green">Active</Badge>}
                      {f.status === "Inactive" && <Badge tone="gray">Inactive</Badge>}
                      {f.status === "Expired" && <Badge tone="red">Expired</Badge>}
                      {f.status === "Pending Renewal" && (
                        <Badge tone="yellow">Pending Renewal</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {!loading && !error && faculty.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Faculty</div>
            <div className="text-2xl font-bold text-gray-900">{faculty.length}</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {faculty.filter((f) => f.status === "Active").length}
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-sm text-gray-600">Full-time</div>
            <div className="text-2xl font-bold text-blue-600">
              {faculty.filter((f) => f.employmentType === "Full-time").length}
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-sm text-gray-600">Part-time</div>
            <div className="text-2xl font-bold text-purple-600">
              {faculty.filter((f) => f.employmentType === "Part-time").length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}