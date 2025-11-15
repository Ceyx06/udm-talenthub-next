// app/dean/interviews/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { CheckCircle, XCircle } from "lucide-react";

export default function DeanInterviewsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interviews, setInterviews] = useState<any[]>([]);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/interviews/dean?role=DEAN');
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
      }
      
      const contentType = res.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error('Server returned HTML instead of JSON. Check terminal for errors.');
      }
      
      const data = await res.json();
      
      if (data.success) {
        setInterviews(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch interviews');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (interviewId: string, applicationId: string) => {
    if (!confirm('Mark this interview as complete? The applicant will be moved to Evaluation.')) {
      return;
    }

    try {
      const res = await fetch(`/api/interviews/${interviewId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId })
      });

      const data = await res.json();

      if (data.success) {
        alert('Interview marked as complete! Applicant moved to Evaluation.');
        fetchInterviews(); // Refresh the list
      } else {
        alert(data.error || 'Failed to mark as complete');
      }
    } catch (err: any) {
      console.error('Error marking complete:', err);
      alert('Failed to mark interview as complete');
    }
  };

  const handleMarkIncomplete = async (interviewId: string, applicationId: string) => {
    const reason = prompt('Reason for marking incomplete (optional):');
    
    try {
      const res = await fetch(`/api/interviews/${interviewId}/incomplete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, reason })
      });

      const data = await res.json();

      if (data.success) {
        alert('Interview marked as incomplete. Applicant moved back to HR Applicants for rescheduling.');
        fetchInterviews(); // Refresh the list
      } else {
        alert(data.error || 'Failed to mark as incomplete');
      }
    } catch (err: any) {
      console.error('Error marking incomplete:', err);
      alert('Failed to mark interview as incomplete');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Interview & Demo" subtitle="Loading..." />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <PageHeader title="Interview & Demo" subtitle="Error loading interviews" />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-semibold text-red-900 mb-2">Error</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="space-y-2 text-sm text-red-600">
            <p><strong>Troubleshooting steps:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Check if file exists: <code className="bg-red-100 px-1 rounded">app/api/interviews/dean/route.ts</code></li>
              <li>Check terminal for build errors</li>
              <li>Restart dev server: <code className="bg-red-100 px-1 rounded">npm run dev</code></li>
              <li>Check browser console (F12) for more details</li>
            </ol>
          </div>
          <button
            onClick={fetchInterviews}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Interview & Demo"
        subtitle="Manage interview schedules and teaching demonstrations"
      />

      {/* Interviews Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        {interviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg font-medium mb-2">No interviews scheduled yet</p>
            <p className="text-sm">Interviews will appear here after HR schedules them.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interview Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {interviews.map((interview: any) => (
                  <tr key={interview.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {interview.application?.fullName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {interview.application?.email || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {interview.application?.vacancy?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        interview.status === 'Scheduled' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {interview.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {interview.interviewDate 
                        ? new Date(interview.interviewDate).toLocaleDateString()
                        : 'Not set'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Mark Complete Button */}
                        <button
                          onClick={() => handleMarkComplete(interview.id, interview.applicationId)}
                          className="px-3 py-1.5 text-xs bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors flex items-center gap-1.5 font-medium"
                          title="Mark Interview as Complete"
                        >
                          <CheckCircle size={14} />
                          Mark Complete
                        </button>

                        {/* Mark Incomplete Button */}
                        <button
                          onClick={() => handleMarkIncomplete(interview.id, interview.applicationId)}
                          className="px-3 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors flex items-center gap-1.5 font-medium"
                          title="Mark Interview as Incomplete"
                        >
                          <XCircle size={14} />
                          Mark Incomplete
                        </button>
                      </div>
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