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
  deanRemarks?: string;
  vacancy: {
    title: string;
    college: string;
  };
}

export default function DeanApplicantsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING_DEAN_APPROVAL' | 'ENDORSED'>('PENDING_DEAN_APPROVAL');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  
  useEffect(() => {
    fetchAllApplications();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, allApplications]);

  const fetchAllApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/application');
      const data = await res.json();
      
      if (data.success) {
        const filtered = data.data.filter((app: Application) => 
          app.stage === 'PENDING_DEAN_APPROVAL' || 
          app.stage === 'ENDORSED' || 
          app.stage === 'DISAPPROVED'
        );
        setAllApplications(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    if (filter === 'ALL') {
      setApplications(allApplications);
    } else {
      setApplications(allApplications.filter(app => app.stage === filter));
    }
  };

  const pendingCount = allApplications.filter(a => a.stage === 'PENDING_DEAN_APPROVAL').length;
  const approvedCount = allApplications.filter(a => a.stage === 'ENDORSED').length;
  const disapprovedCount = allApplications.filter(a => a.stage === 'DISAPPROVED').length;

  const handleApprove = async (appId: string) => {
    const remarks = prompt('Optional: Add remarks for this approval');

    try {
      const res = await fetch(`/api/application/${appId}/dean-action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE',
          remarks: remarks || ''
        })
      });

      const data = await res.json();
      
      if (data.success) {
        alert('✅ Application approved! HR can now schedule interview.');
        fetchAllApplications();
        setSelectedApp(null);
      } else {
        alert(data.error || 'Failed to approve application');
      }
    } catch (error) {
      console.error('Approve error:', error);
      alert('Failed to approve application');
    }
  };

  const handleDisapprove = async (appId: string) => {
    const remarks = prompt('Please provide a reason for disapproval:');
    if (!remarks) {
      alert('Remarks are required for disapproval');
      return;
    }

    try {
      const res = await fetch(`/api/application/${appId}/dean-action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DISAPPROVE',
          remarks
        })
      });

      const data = await res.json();
      
      if (data.success) {
        alert('❌ Application disapproved');
        fetchAllApplications();
        setSelectedApp(null);
      } else {
        alert(data.error || 'Failed to disapprove application');
      }
    } catch (error) {
      console.error('Disapprove error:', error);
      alert('Failed to disapprove application');
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'APPLIED': 'bg-gray-100 text-gray-800',
      'PENDING_DEAN_APPROVAL': 'bg-orange-100 text-orange-800',
      'ENDORSED': 'bg-teal-100 text-teal-800',
      'DISAPPROVED': 'bg-red-100 text-red-800',
      'INTERVIEW_SCHEDULED': 'bg-purple-100 text-purple-800',
      'EVALUATED': 'bg-indigo-100 text-indigo-800',
      'FOR_HIRING': 'bg-amber-100 text-amber-800',
      'HIRED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const formatStage = (stage: string) => {
    const labels: Record<string, string> = {
      'PENDING_DEAN_APPROVAL': 'Pending Your Approval',
      'ENDORSED': 'Approved',
      'DISAPPROVED': 'Disapproved'
    };
    return labels[stage] || stage.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="ml-4 text-gray-500">Loading applications...</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-600">Pending Your Approval</p>
          <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-600">Disapproved</p>
          <p className="text-3xl font-bold text-red-600">{disapprovedCount}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b bg-white rounded-t-xl px-4">
        {[
          { key: 'ALL', label: 'All' },
          { key: 'PENDING_DEAN_APPROVAL', label: 'Pending Approval' },
          { key: 'ENDORSED', label: 'Approved' }
        ].map((f) => {
          const count = f.key === 'ALL' 
            ? allApplications.length 
            : allApplications.filter(a => a.stage === f.key).length;
          
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-4 py-3 font-medium text-sm transition ${
                filter === f.key
                  ? 'border-b-2 border-teal-600 text-teal-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endorsed Date</th>
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
                      {app.endorsedDate ? new Date(app.endorsedDate).toLocaleDateString() : 'N/A'}
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
                        
                        {app.stage === 'PENDING_DEAN_APPROVAL' && (
                          <>
                            <button
                              onClick={() => handleApprove(app.id)}
                              className="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded-md transition flex items-center gap-1"
                              title="Approve"
                            >
                              <CheckCircle size={14} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleDisapprove(app.id)}
                              className="px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 rounded-md transition flex items-center gap-1"
                              title="Disapprove"
                            >
                              <XCircle size={14} />
                              Disapprove
                            </button>
                          </>
                        )}
                        
                        {app.stage === 'ENDORSED' && (
                          <span className="flex items-center gap-1 text-xs text-teal-600 px-2 py-1 bg-teal-50 rounded">
                            <Clock size={14} />
                            Awaiting HR Schedule
                          </span>
                        )}

                        {app.stage === 'DISAPPROVED' && app.deanRemarks && (
                          <span className="text-xs text-red-600 italic" title={app.deanRemarks}>
                            "{app.deanRemarks.substring(0, 30)}..."
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

      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Application Details</h3>
              <button onClick={() => setSelectedApp(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
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
              
              {selectedApp.deanRemarks && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <label className="text-sm font-medium text-yellow-800">Your Remarks</label>
                  <p className="text-sm text-yellow-900 mt-1">{selectedApp.deanRemarks}</p>
                </div>
              )}
              
              {selectedApp.stage === 'PENDING_DEAN_APPROVAL' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleApprove(selectedApp.id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Approve Application
                  </button>
                  <button
                    onClick={() => handleDisapprove(selectedApp.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Disapprove
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