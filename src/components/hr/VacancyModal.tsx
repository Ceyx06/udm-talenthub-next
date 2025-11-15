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
        status: 'OPEN',
        description: '',
        requirements: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (vacancy) {
            setFormData({
                college: vacancy.college,
                title: vacancy.title,
                status: vacancy.status || 'OPEN',
                description: vacancy.description,
                requirements: vacancy.requirements
            });
        } else {
            // Reset form when creating new vacancy
            setFormData({
                college: '',
                title: '',
                status: 'OPEN',
                description: '',
                requirements: ''
            });
        }
    }, [vacancy]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const url = vacancy 
                ? `/api/hr/vacancies/${vacancy.id}`
                : '/api/hr/vacancies';
            
            const method = vacancy ? 'PUT' : 'POST';

            console.log('=== VACANCY FORM SUBMISSION ===');
            console.log('URL:', url);
            console.log('Method:', method);
            console.log('Form Data:', formData);

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            console.log('Response Status:', response.status);
            console.log('Response OK:', response.ok);

            let data;
            try {
                data = await response.json();
                console.log('Response Data:', data);
            } catch (parseError) {
                console.error('Failed to parse response:', parseError);
                throw new Error('Invalid response from server');
            }

            if (response.ok) {
                console.log('✅ Success! Vacancy saved.');
                onSuccess();
                onClose();
            } else {
                const errorMessage = data.error || data.message || `Failed to save vacancy (${response.status})`;
                setError(errorMessage);
                console.error('❌ API Error:', errorMessage);
                if (data.details) {
                    console.error('Error Details:', data.details);
                }
            }
        } catch (error) {
            console.error('❌ Network/Request Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
            setError(errorMessage);
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
                            type="button"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-red-800">Error saving vacancy</p>
                                    <p className="text-sm text-red-700 mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

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
                                <option value="CENG">CCS - College of Computing Studies</option>
                                <option value="CCj">CCJ - College of and Criminal Justice</option>
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
                                <option value="OPEN">Open</option>
                                <option value="CLOSED">Closed</option>
                                <option value="ON_HOLD">On Hold</option>
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
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-6 py-2 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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