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

export default function CareersPage() {
    const [vacancies, setVacancies] = useState<Vacancy[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);

    useEffect(() => {
        fetchVacancies();
    }, []);

    const fetchVacancies = async () => {
        try {
            const response = await fetch('/api/public/vacancies');
            
            if (!response.ok) {
                throw new Error('Failed to fetch vacancies');
            }
            
            const data = await response.json();
            setVacancies(data);
            setError('');
        } catch (err) {
            console.error('Error fetching vacancies:', err);
            setError('Error loading jobs. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl">Loading vacancies...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">UDM Job Vacancies</h1>
                    <p className="text-gray-600 mt-2">Join our team of dedicated educators and professionals</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {vacancies.length === 0 && !error ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-600 text-lg">No vacancies available at the moment.</p>
                        <p className="text-gray-500 mt-2">Please check back later for new opportunities.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {vacancies.map((vacancy) => (
                            <div
                                key={vacancy.id}
                                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="text-2xl font-semibold text-gray-900">
                                                {vacancy.title}
                                            </h2>
                                            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                                                {vacancy.status}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                            <span className="font-medium">{vacancy.college}</span>
                                            <span>Posted: {formatDate(vacancy.postedDate)}</span>
                                        </div>

                                        <p className="text-gray-700 mb-2">{vacancy.description}</p>
                                        <div className="text-sm text-gray-600">
                                            <strong>Requirements:</strong> {vacancy.requirements}
                                        </div>

                                        <button
                                            onClick={() => setSelectedVacancy(vacancy)}
                                            className="mt-4 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Apply Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {selectedVacancy && (
                <ApplicationModal
                    vacancy={selectedVacancy}
                    onClose={() => setSelectedVacancy(null)}
                />
            )}
        </div>
    );
}

function ApplicationModal({ vacancy, onClose }: { vacancy: Vacancy; onClose: () => void }) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        coverLetter: '',
        resume: null as File | null
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('vacancyId', vacancy.id);
            formDataToSend.append('fullName', formData.fullName);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('coverLetter', formData.coverLetter);
            if (formData.resume) {
                formDataToSend.append('resume', formData.resume);
            }

            const response = await fetch('/api/public/applications', {
                method: 'POST',
                body: formDataToSend
            });

            if (response.ok) {
                alert('Application submitted successfully!');
                onClose();
            } else {
                alert('Failed to submit application. Please try again.');
            }
        } catch (err) {
            console.error('Error submitting application:', err);
            alert('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Apply for Position</h2>
                            <p className="text-gray-600 mt-1">{vacancy.title}</p>
                        </div>
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
                                Full Name *
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cover Letter *
                            </label>
                            <textarea
                                required
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.coverLetter}
                                onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                                placeholder="Tell us why you're a great fit for this position..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Resume/CV *
                            </label>
                            <input
                                type="file"
                                required
                                accept=".pdf,.doc,.docx"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onChange={(e) => setFormData({ ...formData, resume: e.target.files?.[0] || null })}
                            />
                            <p className="text-sm text-gray-500 mt-1">Accepted formats: PDF, DOC, DOCX</p>
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
                                className="flex-1 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                            >
                                {submitting ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}