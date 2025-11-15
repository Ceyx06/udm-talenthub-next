// src/app/dean/applicants/page.tsx
"use client";

import React from "react";
import { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { CheckCircle, XCircle, Eye, Clock } from "lucide-react";

interface Application {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  stage: string;
  status: string;
  appliedDate: string;
  endorsedDate?: string;
  vacancy: {
    title: string;
    college: string;
  };
}

export default function DeanApplicantsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'APPLIED' | 'ENDORSED'>('APPLIED');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ role: 'DEAN' });
      if (filter !== 'ALL') {
        params.append('stage', filter);
      }
      
      const res = await fetch(`/api/application/list?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setApplications(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndorse = async (appId: string) => {
    if (!confirm('Are you sure you want to endorse this applicant?')) return;

    try {
      const res = await fetch(`/api/application/${appId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'ENDORSED',
          userRole: 'DEAN'
        })
      });

      const data = await res.json();
      
      if (data.success) {
        alert('Application endorsed successfully! HR can now schedule interview.');
        fetchApplications();
      } else {
        alert(data.error || 'Failed to endorse application');
      }
    } catch (error) {
      console.error('Endorse error:', error);
      alert('Failed to endorse application');
    }
  };

  const handleReject = async (appId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const res = await fetch(`/api/application/${appId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'REJECTED',
          userRole: 'DEAN',
          notes: reason
        })
      });

      const data = await res.json();
      
      if (data.success) {
        alert('Application rejected');
        fetchApplications();
      } else {
        alert(data.error || 'Failed to reject application');
      }
    } catch (error) {
      console.error('Reject error:', error);
      alert('Failed to reject application');
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'APPLIED': 'bg-blue-100 text-blue-800',
      'ENDORSED': 'bg-teal-100 text-teal-800',
      'INTERVIEW_SCHEDULED': 'bg-purple-100 text-purple-800',
      'EVALUATED': 'bg-indigo-100 text-indigo-800',
      'FOR_HIRING': 'bg-amber-100 text-amber-800',
      'HIRED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const formatStage = (stage: string) => {
    return stage.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading applications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="View Applicants"
        subtitle="Review and endorse applicants for HR to proceed with interviews"
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {['ALL', 'APPLIED', 'ENDORSED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 font-medium text-sm transition ${
              filter === f
                ? 'border-b-2 border-teal-600 text-teal-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {f} ({applications.filter(a => f === 'ALL' || a.stage === f).length})
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-xl shadow-sm border">
        {applications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No applications found for this filter
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">College</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{app.fullName}</div>
                        <div className="text-sm text-gray-500">{app.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{app.vacancy.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{app.vacancy.college}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(app.appliedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(app.stage)}`}>
                        {formatStage(app.stage)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {app.stage === 'APPLIED' && (
                          <>
                            <button
                              onClick={() => handleEndorse(app.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Endorse"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleReject(app.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {app.stage === 'ENDORSED' && (
                          <span className="flex items-center gap-1 text-xs text-teal-600">
                            <Clock size={14} />
                            Awaiting HR
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Application Details</h3>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900">{selectedApp.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{selectedApp.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{selectedApp.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Position</label>
                  <p className="text-gray-900">{selectedApp.vacancy.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">College</label>
                  <p className="text-gray-900">{selectedApp.vacancy.college}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Stage</label>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStageColor(selectedApp.stage)}`}>
                    {formatStage(selectedApp.stage)}
                  </span>
                </div>
              </div>
              
              {selectedApp.stage === 'APPLIED' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      handleEndorse(selectedApp.id);
                      setSelectedApp(null);
                    }}
                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                  >
                    Endorse Applicant
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedApp.id);
                      setSelectedApp(null);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}