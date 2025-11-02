'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, CheckCircle } from 'lucide-react';

function ApplyPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const vacancyId = searchParams.get('vacancy');

    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        dob: '',
        gender: '',
        civilStatus: 'Single',
        contactNo: '',
        email: '',
        presentAddress: '',
        permanentAddress: '',
        nationality: '',
        idType: '',
        idNumber: '',
        desiredPosition: '',
        department: '',
        employmentType: 'Full-time',
        highestDegree: '',
        trainingHours: '',
        licenseName: '',
        licenseNo: '',
        licenseExpiry: '',
        signature: '',
        signedAt: new Date().toISOString().split('T')[0],
        qrCode: `UDM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        message: ''
    });

    const [experiences, setExperiences] = useState([
        { employer: '', title: '', from: '', to: '', desc: '' }
    ]);

    const [references, setReferences] = useState([
        { name: '', relation: '', company: '', email: '', contact: '' }
    ]);

    const [consent, setConsent] = useState(false);

    useEffect(() => {
        if (!vacancyId) {
            setError('No vacancy specified');
            setLoading(false);
            return;
        }

        fetch(`/api/vacancies/${vacancyId}`)
            .then(async res => {
                if (!res.ok) {
                    throw new Error('Vacancy not found');
                }
                const data = await res.json();
                return data;
            })
            .then(data => {
                setJob(data);
                setFormData(prev => ({
                    ...prev,
                    desiredPosition: data.title || '',
                    department: data.college || ''
                }));

                const postedDate = new Date(data.postedDate).getTime();
                const now = Date.now();
                const daysPassed = (now - postedDate) / (1000 * 60 * 60 * 24);

                if (daysPassed > 15 || (data.status && data.status.toUpperCase() !== 'ACTIVE' && data.status.toUpperCase() !== 'OPEN')) {
                    setIsExpired(true);
                }

                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching vacancy:', err);
                setError(err.message || 'Failed to load job posting');
                setLoading(false);
            });
    }, [vacancyId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const addExperience = () => {
        setExperiences([...experiences, { employer: '', title: '', from: '', to: '', desc: '' }]);
    };

    const removeExperience = (index: number) => {
        setExperiences(experiences.filter((_, i) => i !== index));
    };

    const updateExperience = (index: number, field: string, value: string) => {
        const updated = [...experiences];
        updated[index] = { ...updated[index], [field]: value };
        setExperiences(updated);
    };

    const addReference = () => {
        setReferences([...references, { name: '', relation: '', company: '', email: '', contact: '' }]);
    };

    const removeReference = (index: number) => {
        setReferences(references.filter((_, i) => i !== index));
    };

    const updateReference = (index: number, field: string, value: string) => {
        const updated = [...references];
        updated[index] = { ...updated[index], [field]: value };
        setReferences(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!consent) {
            setError('Please provide your consent to submit the application.');
            return;
        }

        setSubmitting(true);
        setError('');

        const payload = {
            vacancyId,
            ...formData,
            fullName: `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim(),
            phone: formData.contactNo,
            resumeUrl: '',
            coverLetter: formData.message,
            experiences: JSON.stringify(experiences.filter(e => e.employer || e.title)),
            references: JSON.stringify(references.filter(r => r.name))
        };

        try {
            const response = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => router.push('/jobs'), 2000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to submit application');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="text-red-600 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
                    <p className="text-gray-600 mb-6">{error || 'Vacancy not found'}</p>
                    <a href="/jobs" className="inline-block px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors">
                        View All Jobs
                    </a>
                </div>
            </div>
        );
    }

    if (isExpired) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="text-orange-600 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Closed</h1>
                    <p className="text-gray-600 mb-2">This job posting is no longer accepting applications.</p>
                    <p className="text-sm text-gray-500 mb-6">{job.title} - {job.college}</p>
                    <a href="/jobs" className="inline-block px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors">
                        View Other Opportunities
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <button onClick={() => router.push('/jobs')} className="mb-6 flex items-center gap-2 text-gray-700 hover:text-gray-900 font-semibold bg-white px-4 py-2 rounded-lg shadow-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to Vacancies
                </button>

                <div className="bg-white rounded-lg shadow-lg p-8">
                    {success ? (
                        <div className="text-center py-12">
                            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
                            <p className="text-gray-600">We will review your application and contact you via email.</p>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Apply: {job?.title || 'Job Application'}</h1>
                            <div className="flex gap-2 mb-6">
                                <span className="px-3 py-1 bg-gray-100 border border-gray-300 rounded-full text-sm font-semibold text-gray-700">{job?.college}</span>
                                {job?.status && (job.status.toUpperCase() === 'OPEN' || job.status.toUpperCase() === 'ACTIVE') && (
                                    <span className="px-3 py-1 bg-green-100 border border-green-300 rounded-full text-sm font-semibold text-green-800">Active</span>
                                )}
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Keep all your existing form sections here - they're fine */}
                                {/* I'm omitting them for brevity, but keep everything from line 184 onwards */}

                                {/* Just make sure you have all the form sections */}
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ApplyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <ApplyPageContent />
        </Suspense>
    );
}