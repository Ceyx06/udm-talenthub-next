// components/hr/ApplicantsTable.tsx
'use client';

import { Application } from '@/types/application';
import { Eye, Trash2, Calendar } from 'lucide-react';

export interface ApplicantsTableProps {
  applications: Application[];
  onView: (application: Application) => void;
  onDelete: (applicationId: string) => void;
  onScheduleInterview?: (application: Application) => void;
  onRefresh: () => void;
}

export default function ApplicantsTable({
  applications,
  onView,
  onDelete,
  onScheduleInterview,
  onRefresh,
}: ApplicantsTableProps) {
  
  const getStageColor = (stage: string): string => {
    const colors: Record<string, string> = {
      'APPLIED': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'ENDORSED': 'bg-blue-100 text-blue-800',
      'INTERVIEW_SCHEDULED': 'bg-purple-100 text-purple-800',
      'EVALUATED': 'bg-indigo-100 text-indigo-800',
      'FOR_HIRING': 'bg-amber-100 text-amber-800',
      'HIRED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const formatStage = (stage: string): string => {
    return stage.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">No applications found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applicant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                College
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applied Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications.map((application) => (
              <tr key={application.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {application.fullName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {application.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {application.vacancy?.title || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {application.vacancy?.college || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(application.appliedDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageColor(application.stage || 'APPLIED')}`}>
                    {formatStage(application.stage || 'APPLIED')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {/* View Button */}
                    <button
                      onClick={() => onView(application)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>

                    {/* Schedule Interview Button - Only for ENDORSED applications */}
                    {application.stage === 'ENDORSED' && onScheduleInterview && (
                      <button
                        onClick={() => onScheduleInterview(application)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1"
                        title="Schedule Interview"
                      >
                        <Calendar size={14} />
                        <span className="font-medium">Schedule</span>
                      </button>
                    )}

                    {/* Show interview date for INTERVIEW_SCHEDULED */}
                    {application.stage === 'INTERVIEW_SCHEDULED' && application.interviewDate && (
                      <span className="text-xs text-purple-600 flex items-center gap-1 px-2 py-1 bg-purple-50 rounded">
                        <Calendar size={12} />
                        {new Date(application.interviewDate).toLocaleDateString()}
                        <span className="text-purple-500 ml-1">(Dean will conduct)</span>
                      </span>
                    )}

                    {/* Delete Button - Only for non-hired applications */}
                    {application.stage !== 'HIRED' && (
                      <button
                        onClick={() => onDelete(application.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}