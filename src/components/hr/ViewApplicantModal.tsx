// src/components/hr/ViewApplicantModal.tsx
'use client';

import { useState } from 'react';
import { Application } from '@/types/application';

interface ViewApplicantModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  onEndorse: (applicationId: string) => void;
  onUpdateFileStatus: (applicationId: string, status: string) => void;
  onScheduleInterview?: () => void;
}

export default function ViewApplicantModal({
  isOpen,
  onClose,
  application,
  onEndorse,
  onUpdateFileStatus,
  onScheduleInterview
}: ViewApplicantModalProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'documents' | 'education' | 'experience'>('personal');
  const [fileStatus, setFileStatus] = useState<string>('pending');

  if (!isOpen) return null;

  // Calculate file status
  const getFileCompletionStatus = () => {
    const requiredFiles = ['pdsUrl', 'transcriptUrl', 'trainingsUrl', 'employmentUrl'];
    const uploadedFiles = requiredFiles.filter(file => application[file as keyof Application]);
    
    if (uploadedFiles.length === requiredFiles.length) return 'complete';
    if (uploadedFiles.length > 0) return 'partial';
    return 'incomplete';
  };

  const currentFileStatus = getFileCompletionStatus();

  const handleUpdateFileStatus = () => {
    onUpdateFileStatus(application.id, fileStatus);
  };

  // Check if application is ready for interview scheduling
  const canScheduleInterview = application.stage === 'ENDORSED';

  // Parse experiences and references if they're stored as JSON strings
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-teal-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Application Details</h2>
            <p className="text-teal-100 text-sm">QR Code: {application.qrCode}</p>
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

        {/* Content */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <p className="text-gray-900">
                    {application.dob ? new Date(application.dob).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <p className="text-gray-900">{application.gender || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
                  <p className="text-gray-900">{application.civilStatus || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                  <p className="text-gray-900">{application.nationality || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
                  <p className="text-gray-900">{application.idType || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Present Address</label>
                <p className="text-gray-900">{application.presentAddress || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Address</label>
                <p className="text-gray-900">{application.permanentAddress || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900">File Status</h3>
                    <p className="text-sm text-blue-700">
                      Current status: <span className="font-semibold capitalize">{currentFileStatus}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={fileStatus}
                      onChange={(e) => setFileStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="partial">Partial</option>
                      <option value="complete">Complete</option>
                    </select>
                    <button
                      onClick={handleUpdateFileStatus}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: 'Personal Data Sheet (PDS)', url: application.pdsUrl },
                  { label: 'Transcript of Records', url: application.transcriptUrl },
                  { label: 'Training Certificates', url: application.trainingsUrl },
                  { label: 'Employment History', url: application.employmentUrl },
                  { label: 'Resume/CV', url: application.resumeUrl }
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
                      <span className="px-4 py-2 bg-gray-300 text-gray-600 rounded-md text-sm cursor-not-allowed">
                        N/A
                      </span>
                    )}
                  </div>
                ))}
              </div>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Name</label>
                  <p className="text-gray-900">{application.licenseName || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <p className="text-gray-900">{application.licenseNo || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry</label>
                  <p className="text-gray-900">
                    {application.licenseExpiry ? new Date(application.licenseExpiry).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === 'experience' && (
            <div className="space-y-6">
              {/* Work Experience Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Experience</h3>
                {experiences.length > 0 ? (
                  <div className="space-y-3">
                    {experiences.map((exp: any, index: number) => (
                      <div key={index} className="border-l-4 border-teal-500 bg-gray-50 p-4 rounded-r-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-lg">
                              {exp.jobTitle || exp.position || 'N/A'}
                            </p>
                            <p className="text-gray-700 font-medium">
                              {exp.employer || exp.company || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {exp.from || exp.startDate || 'N/A'} - {exp.to || exp.endDate || 'Present'}
                            </p>
                            {(exp.responsibilities || exp.description) && (
                              <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
                                {exp.responsibilities || exp.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 font-medium">No work experience provided</p>
                  </div>
                )}
              </div>

              {/* References Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">References</h3>
                {references.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {references.map((ref: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="font-semibold text-gray-900">{ref.name || 'N/A'}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {ref.position || 'N/A'}
                        </p>
                        {ref.company && (
                          <p className="text-sm text-gray-600">{ref.company}</p>
                        )}
                        <div className="mt-2 space-y-1">
                          {ref.email && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {ref.email}
                            </p>
                          )}
                          {ref.contactNumber && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {ref.contactNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500 font-medium">No references provided</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Stage:</span> {application.stage} | 
            <span className="font-medium ml-2">Status:</span> {application.status}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            {canScheduleInterview && onScheduleInterview && (
              <button
                onClick={onScheduleInterview}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                📅 Schedule Interview
              </button>
            )}
            {!application.endorsedDate && (
              <button
                onClick={() => onEndorse(application.id)}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
              >
                Endorse to Dean
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}