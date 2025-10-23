'use client';

import { useState, useEffect } from 'react';

interface Vacancy {
    id: string;
    college: string;
    title: string;
    status: string;
    description: string;
    requirements: string;
    postedDate: string;
}

interface VacancyModalProps {
    vacancy: Vacancy | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function VacancyModal({ vacancy, onClose, onSuccess }: VacancyModalProps) {
    const [formData, setFormData] = useState({
        college: '',
        title: '',
        status: 'Active',
        description: '',
        requirements: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (vacancy) {
            setFormData({
                college: vacancy.college,
                title: vacancy.title,
                status: vacancy.status,
                description: vacancy.description,
                requirements: vacancy.requirements
            });
        }
    }, [vacancy]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const url = vacancy 
                ? `/api/hr/vacancies/${vacancy.id}`
                : '/api/hr/vacancies';
            
            const method = vacancy ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                onSuccess();
            } else {
                alert('Failed to save vacancy');
            }
        } catch (error) {
            console.error('Error saving vacancy:', error);
            alert('Error saving vacancy');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {vacancy ? 'Edit Vacancy' : 'Post New Vacancy'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                College/Department *
                            </label>
                            <select
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.college}
                                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                            >
                                <option value="">Select College</option>
                                <option value="CAS">CAS - College of Arts and Sciences</option>
                                <option value="CHS">CHS - College of Health Sciences</option>
                                <option value="CBPM">CBPM - College of Business and Public Management</option>
                                <option value="CED">CED - College of Education</option>
                                <option value="CENG">CENG - College of Engineering</option>
                                <option value="CITCS">CITCS - College of Information Technology and Computer Science</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Job Title *
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Assistant Professor - Mathematics"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status *
                            </label>
                            <select
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="Active">Active</option>
                                <option value="Closed">Closed</option>
                                <option value="On Hold">On Hold</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Job Description *
                            </label>
                            <textarea
                                required
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of the position..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Requirements *
                            </label>
                            <textarea
                                required
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.requirements}
                                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                placeholder="Education, experience, certifications required..."
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-6 py-2 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors disabled:bg-gray-400"
                            >
                                {submitting ? 'Saving...' : vacancy ? 'Update Vacancy' : 'Post Vacancy'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}