// src/components/dean/DeanApprovalModal.tsx
'use client';

import { useState } from 'react';
import { Application } from '@/types/application';

interface DeanApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  onApprove: (applicationId: string, remarks?: string) => void;
  onReject: (applicationId: string, remarks: string) => void;
}

export default function DeanApprovalModal({
  isOpen,
  onClose,
  application,
  onApprove,
  onReject,
}: DeanApprovalModalProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'documents' | 'education' | 'experience'>('personal');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isPendingApproval = application.status === 'PENDING_DEAN_APPROVAL' && application.stage === 'ENDORSED';

  const handleAction = async () => {
    if (actionType === 'reject' && !remarks.trim()) {
      alert('Please provide remarks for rejection');
      return;
    }

    setLoading(true);
    try {
      if (actionType === 'approve') {
        await onApprove(application.id, remarks || undefined);
      } else {
        await onReject(application.id, remarks);
      }
      setShowApprovalDialog(false);
      onClose();
    } catch (error) {
      console.error('Error processing action:', error);
      alert('Failed to process action');
    } finally {
      setLoading(false);
    }
  };

  // Parse experiences and references
  const parseJsonField = (field: any) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const experiences = parseJsonField(application.experiences);
  const references = parseJsonField(application.references);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-teal-600 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Application Review</h2>
              <p className="text-teal-100 text-sm">
                {application.fullName} - {application.vacancy?.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-teal-700 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Status Banner */}
          {isPendingApproval && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
              <div className="flex items-center gap-2 text-yellow-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">This application is awaiting your approval</span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6">
            <nav className="flex gap-4">
              {[
                { id: 'personal', label: 'Personal Info' },
                { id: 'documents', label: 'Documents' },
                { id: 'education', label: 'Education' },
                { id: 'experience', label: 'Experience' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content - Same as HR modal */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <p className="text-gray-900">{application.fullName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{application.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <p className="text-gray-900">{application.phone || application.contactNo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desired Position</label>
                    <p className="text-gray-900">{application.desiredPosition}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <p className="text-gray-900">{application.department}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                    <p className="text-gray-900">{application.employmentType}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-3">
                {[
                  { label: 'Personal Data Sheet (PDS)', url: application.pdsUrl },
                  { label: 'Transcript of Records', url: application.transcriptUrl },
                  { label: 'Training Certificates', url: application.trainingsUrl },
                  { label: 'Employment History', url: application.employmentUrl },
                ].map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">{doc.label}</p>
                        <p className="text-sm text-gray-500">
                          {doc.url ? 'Uploaded' : 'Not uploaded'}
                        </p>
                      </div>
                    </div>
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm"
                      >
                        View
                      </a>
                    ) : (
                      <span className="px-4 py-2 bg-gray-300 text-gray-600 rounded-md text-sm">N/A</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Highest Degree</label>
                    <p className="text-gray-900">{application.highestDegree || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Training Hours</label>
                    <p className="text-gray-900">{application.trainingHours || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Experience</h3>
                  {experiences.length > 0 ? (
                    <div className="space-y-3">
                      {experiences.map((exp: any, index: number) => (
                        <div key={index} className="border-l-4 border-teal-500 bg-gray-50 p-4 rounded-r-lg">
                          <p className="font-semibold text-gray-900">{exp.jobTitle}</p>
                          <p className="text-gray-700">{exp.employer}</p>
                          <p className="text-sm text-gray-500">{exp.from} - {exp.to}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No work experience provided</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Status:</span> {application.status}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              {isPendingApproval && (
                <>
                  <button
                    onClick={() => {
                      setActionType('reject');
                      setShowApprovalDialog(true);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    ❌ Reject
                  </button>
                  <button
                    onClick={() => {
                      setActionType('approve');
                      setShowApprovalDialog(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    ✅ Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approval/Rejection Dialog */}
      {showApprovalDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {actionType === 'approve' ? 'Approve Application' : 'Reject Application'}
            </h3>
            <p className="text-gray-600 mb-4">
              {actionType === 'approve' 
                ? 'Are you sure you want to approve this application? HR will be able to schedule an interview.'
                : 'Please provide a reason for rejection:'
              }
            </p>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={actionType === 'approve' ? 'Optional remarks...' : 'Rejection reason (required)'}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent mb-4"
              required={actionType === 'reject'}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowApprovalDialog(false);
                  setRemarks('');
                }}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={loading || (actionType === 'reject' && !remarks.trim())}
                className={`px-4 py-2 rounded-md text-white ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Processing...' : `Confirm ${actionType === 'approve' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}