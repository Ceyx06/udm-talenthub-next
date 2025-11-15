// components/hr/ScheduleInterviewModal.tsx
'use client';

import { useState } from 'react';
import { X, Calendar, Clock, MapPin, Users } from 'lucide-react';

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
  onSchedule: (data: InterviewScheduleData) => Promise<void>;
}

export interface InterviewScheduleData {
  interviewDate: string;
  interviewTime: string;
  teachingDemoDate?: string;
  teachingDemoTime?: string;
  location: string;
  interviewers: string;
  notes?: string;
}

export default function ScheduleInterviewModal({
  isOpen,
  onClose,
  application,
  onSchedule,
}: ScheduleInterviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<InterviewScheduleData>({
    interviewDate: '',
    interviewTime: '',
    teachingDemoDate: '',
    teachingDemoTime: '',
    location: '',
    interviewers: '',
    notes: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.interviewDate || !formData.interviewTime || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await onSchedule(formData);
      onClose();
    } catch (error) {
      console.error('Schedule error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Schedule Interview</h3>
            <p className="text-sm text-gray-600 mt-1">
              {application.fullName} - {application.vacancy.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Interview Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={20} className="text-teal-600" />
              Interview Schedule
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.interviewDate}
                  onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.interviewTime}
                  onChange={(e) => setFormData({ ...formData, interviewTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Teaching Demo (Optional) */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={20} className="text-teal-600" />
              Teaching Demo (Optional)
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Demo Date
                </label>
                <input
                  type="date"
                  value={formData.teachingDemoDate}
                  onChange={(e) => setFormData({ ...formData, teachingDemoDate: e.target.value })}
                  min={formData.interviewDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Demo Time
                </label>
                <input
                  type="time"
                  value={formData.teachingDemoTime}
                  onChange={(e) => setFormData({ ...formData, teachingDemoTime: e.target.value })}
                  disabled={!formData.teachingDemoDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin size={18} className="text-teal-600" />
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., HR Office, Room 301"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Interviewers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Users size={18} className="text-teal-600" />
              Interviewers <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.interviewers}
              onChange={(e) => setFormData({ ...formData, interviewers: e.target.value })}
              placeholder="e.g., Dr. Smith, Prof. Johnson"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any additional information for the applicant..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}