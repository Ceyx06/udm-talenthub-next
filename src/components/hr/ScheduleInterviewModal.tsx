// src/components/hr/ScheduleInterviewModal.tsx
'use client';

import { useState } from 'react';

export interface InterviewScheduleData {
  interviewDate: string;
  teachingDemoDate: string;
  interviewTime?: string;
  location?: string;
  interviewType?: string;
  notes?: string;
}

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: {
    id: string;
    fullName: string;
    email: string;
    vacancy: {
      title: string;
      college: string;
    };
  };
  onSchedule: (data: InterviewScheduleData) => void;
}

export default function ScheduleInterviewModal({
  isOpen,
  onClose,
  application,
  onSchedule,
}: ScheduleInterviewModalProps) {
  const [formData, setFormData] = useState<InterviewScheduleData>({
    interviewDate: '',
    teachingDemoDate: '',
    interviewTime: '',
    location: 'Universidad de Manila, Mehan Garden, Manila',
    interviewType: 'Panel Interview',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.interviewDate) {
      newErrors.interviewDate = 'Interview date is required';
    }

    if (!formData.teachingDemoDate) {
      newErrors.teachingDemoDate = 'Teaching demo date is required';
    }

    // Validate that demo date is after or equal to interview date
    if (formData.interviewDate && formData.teachingDemoDate) {
      const interviewDate = new Date(formData.interviewDate);
      const demoDate = new Date(formData.teachingDemoDate);
      
      if (demoDate < interviewDate) {
        newErrors.teachingDemoDate = 'Teaching demo date should be on or after the interview date';
      }
    }

    // Validate that dates are not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (formData.interviewDate) {
      const interviewDate = new Date(formData.interviewDate);
      if (interviewDate < today) {
        newErrors.interviewDate = 'Interview date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSchedule(formData);
  };

  const handleCancel = () => {
    setFormData({
      interviewDate: '',
      teachingDemoDate: '',
      interviewTime: '',
      location: 'Universidad de Manila, Mehan Garden, Manila',
      interviewType: 'Panel Interview',
      notes: '',
    });
    setErrors({});
    onClose();
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Schedule Interview</h2>
              <p className="text-blue-100 text-sm mt-1">
                {application.fullName} - {application.vacancy.title}
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="text-white hover:bg-blue-700 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Email notification info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Email Notification</p>
                  <p className="text-sm text-blue-700 mt-1">
                    An email with interview details will be automatically sent to{' '}
                    <strong>{application.email}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Interview Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="interviewDate"
                value={formData.interviewDate}
                onChange={handleChange}
                min={today}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.interviewDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.interviewDate && (
                <p className="mt-1 text-sm text-red-600">{errors.interviewDate}</p>
              )}
            </div>

            {/* Interview Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Time (Optional)
              </label>
              <input
                type="time"
                name="interviewTime"
                value={formData.interviewTime}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Specify the time for the initial interview</p>
            </div>

            {/* Teaching Demo Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teaching Demonstration Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="teachingDemoDate"
                value={formData.teachingDemoDate}
                onChange={handleChange}
                min={formData.interviewDate || today}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.teachingDemoDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.teachingDemoDate && (
                <p className="mt-1 text-sm text-red-600">{errors.teachingDemoDate}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Should be on or after the interview date
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (Optional)
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., HR Office, Room 301"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Interview Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Type (Optional)
              </label>
              <select
                name="interviewType"
                value={formData.interviewType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Type</option>
                <option value="Panel Interview">Panel Interview</option>
                <option value="One-on-One Interview">One-on-One Interview</option>
                <option value="Virtual Interview">Virtual Interview (Online)</option>
                <option value="Department Interview">Department Interview</option>
              </select>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Any additional information for the applicant (e.g., dress code, documents to bring, parking information)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                This will be included in the email notification
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule & Send Email
          </button>
        </div>
      </div>
    </div>
  );
}