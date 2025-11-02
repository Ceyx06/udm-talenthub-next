'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface ScheduleInterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: {
        id: string;
        applicationId: string;
        name: string;
        jobTitle: string;
    };
    onSchedule: (data: {
        applicationId: string;
        interviewDate: string;
        teachingDemoDate: string;
    }) => Promise<void>;
}

export default function ScheduleInterviewModal({
    isOpen,
    onClose,
    application,
    onSchedule,
}: ScheduleInterviewModalProps) {
    const [interviewDate, setInterviewDate] = useState('');
    const [teachingDemoDate, setTeachingDemoDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await onSchedule({
                applicationId: application.id,
                interviewDate,
                teachingDemoDate,
            });
            onClose();
            // Reset form
            setInterviewDate('');
            setTeachingDemoDate('');
        } catch (error) {
            console.error('Failed to schedule interview:', error);
            // Error is already handled in parent component
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Schedule Interview
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Applicant ID</p>
                    <p className="font-semibold text-gray-800">{application.applicationId}</p>
                    <p className="text-sm text-gray-600 mt-2">Name</p>
                    <p className="font-semibold text-gray-800">{application.name}</p>
                    <p className="text-sm text-gray-600 mt-2">Position</p>
                    <p className="font-semibold text-gray-800">{application.jobTitle}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label
                            htmlFor="interviewDate"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Interview Date
                        </label>
                        <input
                            type="datetime-local"
                            id="interviewDate"
                            value={interviewDate}
                            onChange={(e) => setInterviewDate(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="teachingDemoDate"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Teaching Demo Date
                        </label>
                        <input
                            type="datetime-local"
                            id="teachingDemoDate"
                            value={teachingDemoDate}
                            onChange={(e) => setTeachingDemoDate(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Scheduling...' : 'Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}