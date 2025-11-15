'use client';

import { useState } from 'react';
import { APPLICATION_STAGES, DB_STAGES, toDbStage, toDisplayStage } from '@/lib/applicationStages';

interface StageUpdateModalProps {
  applicant: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    stage: string;
  };
  onClose: () => void;
  onUpdate: (applicantId: string, newStage: string, data?: any) => void;
}

const STAGE_TRANSITIONS: Record<string, { next: string; label: string; requiresData: boolean }> = {
  [DB_STAGES.APPLIED]: { next: DB_STAGES.ENDORSED, label: 'Endorse to Dean', requiresData: false },
  [DB_STAGES.ENDORSED]: { next: DB_STAGES.INTERVIEW_SCHEDULED, label: 'Schedule Interview', requiresData: true },
  [DB_STAGES.INTERVIEW_SCHEDULED]: { next: DB_STAGES.EVALUATED, label: 'Submit Evaluation', requiresData: true },
  [DB_STAGES.EVALUATED]: { next: DB_STAGES.FOR_HIRING, label: 'Recommend for Hiring', requiresData: false },
  [DB_STAGES.FOR_HIRING]: { next: DB_STAGES.HIRED, label: 'Mark as Hired', requiresData: true },
};

export default function StageUpdateModal({ applicant, onClose, onUpdate }: StageUpdateModalProps) {
  // FIX: Properly convert the stage to DB format
  // The applicant.stage from the parent is already in display format (e.g., "Applied")
  // We need to convert it to DB format (e.g., "APPLIED")
  const dbStage = toDbStage(applicant.stage);
  const transition = STAGE_TRANSITIONS[dbStage];
  
  const [formData, setFormData] = useState<any>({
    interviewDate: '',
    demoDate: '',
    evaluationScore: '',
    evaluationNotes: '',
    employeeId: '',
    hiredAt: new Date().toISOString().split('T')[0],
  });

  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const applicantName = applicant.name || `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim();

  if (!transition) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">No Further Actions</h3>
          <p className="text-gray-600 mb-4">
            This applicant is at the final stage of the workflow.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (rejecting) {
      if (!rejectionReason.trim()) {
        alert('Please provide a rejection reason');
        return;
      }
      onUpdate(applicant.id, DB_STAGES.REJECTED, { rejectionReason });
      return;
    }

    // Validate based on stage
    let data: any = {};

    if (transition.next === DB_STAGES.INTERVIEW_SCHEDULED) {
      if (!formData.interviewDate) {
        alert('Please select an interview date');
        return;
      }
      data = {
        interviewDate: new Date(formData.interviewDate).toISOString(),
        demoDate: formData.demoDate ? new Date(formData.demoDate).toISOString() : null,
      };
    }

    if (transition.next === DB_STAGES.EVALUATED) {
      if (!formData.evaluationScore || formData.evaluationScore < 0 || formData.evaluationScore > 100) {
        alert('Please provide a valid evaluation score (0-100)');
        return;
      }
      data = {
        evaluationScore: parseFloat(formData.evaluationScore),
        evaluationNotes: formData.evaluationNotes,
      };
    }

    if (transition.next === DB_STAGES.HIRED) {
      if (!formData.employeeId.trim()) {
        alert('Please provide an employee ID');
        return;
      }
      data = {
        employeeId: formData.employeeId,
        hiredAt: new Date(formData.hiredAt).toISOString(),
      };
    }

    onUpdate(applicant.id, transition.next, data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-2">
          Update Application Stage
        </h3>
        <p className="text-gray-600 mb-6">
          {applicantName}
        </p>

        {!rejecting ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Current Stage:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {toDisplayStage(dbStage)}
                </span>
              </div>
              <div className="flex items-center justify-center my-2">
                <div className="text-blue-600">↓</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Next Stage:</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {toDisplayStage(transition.next)}
                </span>
              </div>
            </div>

            {/* Stage-specific fields */}
            {transition.next === DB_STAGES.INTERVIEW_SCHEDULED && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.interviewDate}
                    onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Demo Teaching Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.demoDate}
                    onChange={(e) => setFormData({ ...formData, demoDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </>
            )}

            {transition.next === DB_STAGES.EVALUATED && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evaluation Score (0-100) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.evaluationScore}
                    onChange={(e) => setFormData({ ...formData, evaluationScore: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evaluation Notes
                  </label>
                  <textarea
                    value={formData.evaluationNotes}
                    onChange={(e) => setFormData({ ...formData, evaluationNotes: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter evaluation feedback..."
                  />
                </div>
              </>
            )}

            {transition.next === DB_STAGES.HIRED && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter employee ID"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hire Date
                  </label>
                  <input
                    type="date"
                    value={formData.hiredAt}
                    onChange={(e) => setFormData({ ...formData, hiredAt: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-medium"
              >
                {transition.label}
              </button>
              <button
                type="button"
                onClick={() => setRejecting(true)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800">
                You are about to reject this applicant. This action can be undone later if needed.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Provide a reason for rejection..."
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => setRejecting(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}