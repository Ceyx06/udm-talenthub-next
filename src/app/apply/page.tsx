'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, CheckCircle, Briefcase, MapPin, Calendar, FileText, Upload, X } from 'lucide-react';

function ApplyPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const vacancyId = searchParams.get('vacancy');

    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isExpired, setIsExpired] = useState(false);

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

    // File upload state
    const [files, setFiles] = useState({
        pds: null as File | null,
        transcript: null as File | null,
        trainingCert: null as File | null,
        employmentCert: null as File | null
    });

    const [experiences, setExperiences] = useState([
        { employer: '', title: '', from: '', to: '', desc: '' }
    ]);

    const [references, setReferences] = useState([
        { name: '', relation: '', company: '', email: '', contact: '' }
    ]);

    const [consent, setConsent] = useState(false);

    // Validation helpers
    const validateAge = (dob: string) => {
        if (!dob) return { valid: false, message: '' };
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 18) {
            return { valid: false, message: 'You must be at least 18 years old to apply.' };
        }
        if (age > 70) {
            return { valid: false, message: 'Please enter a valid birth date.' };
        }
        return { valid: true, message: '' };
    };

    const validateContactNumber = (number: string) => {
        // Remove spaces, dashes, and other non-numeric characters
        const cleanNumber = number.replace(/\D/g, '');

        if (cleanNumber.length !== 11) {
            return { valid: false, message: 'Contact number must be exactly 11 digits.' };
        }
        if (!cleanNumber.startsWith('09')) {
            return { valid: false, message: 'Contact number must start with 09.' };
        }
        return { valid: true, message: '' };
    };

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { valid: false, message: 'Please enter a valid email address.' };
        }
        return { valid: true, message: '' };
    };

    useEffect(() => {
        if (!vacancyId) {
            setError('No vacancy specified');
            setLoading(false);
            return;
        }

        fetch(`/api/vacancies/${vacancyId}`)
            .then(async res => {
                if (!res.ok) throw new Error('Vacancy not found');
                return await res.json();
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

    const handleFileChange = (field: keyof typeof files, file: File | null) => {
        setFiles(prev => ({ ...prev, [field]: file }));
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

        // Validate required files
        if (!files.pds || !files.transcript || !files.trainingCert || !files.employmentCert) {
            setError('Please upload all required documents.');
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
            references: JSON.stringify(references.filter(r => r.name)),
            // File names for reference
            pdsFileName: files.pds?.name,
            transcriptFileName: files.transcript?.name,
            trainingCertFileName: files.trainingCert?.name,
            employmentCertFileName: files.employmentCert?.name
        };

        try {
            const response = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => router.push('/jobs'), 3000);
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

    // File Upload Component
    const FileUploadField = ({
        label,
        field,
        accept = ".pdf,.doc,.docx",
        required = false
    }: {
        label: string;
        field: keyof typeof files;
        accept?: string;
        required?: boolean;
    }) => {
        const file = files[field];

        return (
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                    {label} {required && <span className="text-red-600">*</span>}
                </label>

                {!file ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-500" />
                            <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PDF, DOC, DOCX (MAX. 10MB)</p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept={accept}
                            onChange={(e) => {
                                const selectedFile = e.target.files?.[0];
                                if (selectedFile) {
                                    if (selectedFile.size > 10 * 1024 * 1024) {
                                        alert('File size must be less than 10MB');
                                        return;
                                    }
                                    handleFileChange(field, selectedFile);
                                }
                            }}
                            required={required}
                        />
                    </label>
                ) : (
                    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleFileChange(field, null)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading job posting...</p>
                </div>
            </div>
        );
    }

    // Error State
    if (error && !job) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="text-red-600 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/jobs')}
                        className="inline-block px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                    >
                        View All Jobs
                    </button>
                </div>
            </div>
        );
    }

    // Expired State
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
                    <button
                        onClick={() => router.push('/jobs')}
                        className="inline-block px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                    >
                        View Other Opportunities
                    </button>
                </div>
            </div>
        );
    }

    // Success State
    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
                    <p className="text-gray-600 mb-4">We will review your application and contact you via email.</p>
                    <p className="text-sm text-gray-500">Redirecting to job listings...</p>
                </div>
            </div>
        );
    }

    // JOB DETAILS VIEW (Landing Page)
    if (!showForm) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <button
                        onClick={() => router.push('/jobs')}
                        className="mb-6 flex items-center gap-2 text-gray-700 hover:text-gray-900 font-semibold bg-white px-4 py-2 rounded-lg shadow-sm transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Vacancies
                    </button>

                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
                            <h1 className="text-4xl font-bold mb-2">{job.title}</h1>
                            <div className="flex flex-wrap gap-4 text-blue-100">
                                <div className="flex items-center gap-2">
                                    <Briefcase className="w-5 h-5" />
                                    <span>{job.college}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    <span>Universidad De Manila</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    <span>Posted {new Date(job.postedDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <span className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-semibold">
                                    ✓ Active
                                </span>
                            </div>
                        </div>

                        {/* Job Details */}
                        <div className="p-8">
                            {/* Description */}
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                    Job Description
                                </h2>
                                <div className="prose prose-blue max-w-none">
                                    <p className="text-gray-700 whitespace-pre-wrap">
                                        {job.description || 'No description provided.'}
                                    </p>
                                </div>
                            </div>

                            {/* Requirements */}
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h2>
                                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                    <p className="text-gray-700 whitespace-pre-wrap">
                                        {job.requirements || 'No specific requirements listed.'}
                                    </p>
                                </div>
                            </div>

                            {/* Call to Action */}
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    Interested in this position?
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Click the button below to fill out the application form
                                </p>
                                <button
                                    onClick={() => {
                                        setShowForm(true);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-105 text-lg"
                                >
                                    Apply Now →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // APPLICATION FORM VIEW
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <button
                    onClick={() => setShowForm(false)}
                    className="mb-6 flex items-center gap-2 text-gray-700 hover:text-gray-900 font-semibold bg-white px-4 py-2 rounded-lg shadow-sm"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Job Details
                </button>

                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Apply: {job?.title || 'Job Application'}</h1>
                    <div className="flex gap-2 mb-6">
                        <span className="px-3 py-1 bg-gray-100 border border-gray-300 rounded-full text-sm font-semibold text-gray-700">{job?.college}</span>
                        <span className="px-3 py-1 bg-green-100 border border-green-300 rounded-full text-sm font-semibold text-green-800">Active</span>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Personal Details */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">1) Personal Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Last Name <span className="text-red-600">*</span></label>
                                    <input name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">First Name <span className="text-red-600">*</span></label>
                                    <input name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Middle Name</label>
                                    <input name="middleName" value={formData.middleName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Date of Birth <span className="text-red-600">*</span></label>
                                    <input type="date" name="dob" required value={formData.dob} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Gender <span className="text-red-600">*</span></label>
                                    <select name="gender" required value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="">— Select —</option>
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Prefer not to say</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Civil Status</label>
                                    <select name="civilStatus" value={formData.civilStatus} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option>Single</option>
                                        <option>Married</option>
                                        <option>Separated</option>
                                        <option>Widowed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Contact Number <span className="text-red-600">*</span></label>
                                    <input name="contactNo" required value={formData.contactNo} onChange={handleChange} placeholder="+63 9xx xxx xxxx" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Email Address <span className="text-red-600">*</span></label>
                                    <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Present Address <span className="text-red-600">*</span></label>
                                    <input name="presentAddress" required value={formData.presentAddress} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Permanent Address</label>
                                    <input name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Nationality</label>
                                    <input name="nationality" value={formData.nationality} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Valid ID Type</label>
                                    <select name="idType" value={formData.idType} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="">— Select —</option>
                                        <option>PhilID</option>
                                        <option>Passport</option>
                                        <option>Driver's License</option>
                                        <option>PRC</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">ID Number</label>
                                    <input name="idNumber" value={formData.idNumber} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                            </div>
                        </section>

                        {/* Position Applied For */}
                        <section className="border-t border-gray-200 pt-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">2) Position Applied For</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Desired Position <span className="text-red-600">*</span></label>
                                    <input name="desiredPosition" required value={formData.desiredPosition} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Department/College <span className="text-red-600">*</span></label>
                                    <input name="department" required value={formData.department} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Employment Type</label>
                                    <select name="employmentType" value={formData.employmentType} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option>Full-time</option>
                                        <option>Part-time</option>
                                        <option>Contractual</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Education */}
                        <section className="border-t border-gray-200 pt-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">3) Education</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Highest Degree</label>
                                    <input name="highestDegree" value={formData.highestDegree} onChange={handleChange} placeholder="e.g., Master's in Teaching" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Training Hours <span className="text-red-600">*</span></label>
                                    <input name="trainingHours" required value={formData.trainingHours} onChange={handleChange} placeholder="At least 10" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Professional License</label>
                                    <input name="licenseName" value={formData.licenseName} onChange={handleChange} placeholder="e.g., LPT" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">License No.</label>
                                    <input name="licenseNo" value={formData.licenseNo} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">License Expiry</label>
                                    <input type="date" name="licenseExpiry" value={formData.licenseExpiry} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                            </div>
                        </section>

                        {/* Required Documents */}
                        <section className="border-t border-gray-200 pt-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">4) Required Documents</h2>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-yellow-800 font-semibold">
                                    Please upload the following documents (PDF, DOC, or DOCX format, max 10MB each):
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FileUploadField
                                    label="1. Personal Data Sheet / Curriculum Vitae"
                                    field="pds"
                                    required
                                />
                                <FileUploadField
                                    label="2. Certified True Copy of Transcript of Records"
                                    field="transcript"
                                    required
                                />
                                <FileUploadField
                                    label="3. Certified True Copy of Certificate of Trainings Attended"
                                    field="trainingCert"
                                    required
                                />
                                <FileUploadField
                                    label="4. Employment Certification"
                                    field="employmentCert"
                                    required
                                />
                            </div>
                        </section>

                        {/* Work Experience */}
                        <section className="border-t border-gray-200 pt-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">5) Work Experience</h2>
                            {experiences.map((exp, idx) => (
                                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Employer <span className="text-red-600">*</span></label>
                                            <input required value={exp.employer} onChange={(e) => updateExperience(idx, 'employer', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Job Title <span className="text-red-600">*</span></label>
                                            <input required value={exp.title} onChange={(e) => updateExperience(idx, 'title', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">From <span className="text-red-600">*</span></label>
                                            <input type="date" required value={exp.from} onChange={(e) => updateExperience(idx, 'from', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">To <span className="text-red-600">*</span></label>
                                            <input type="date" required value={exp.to} onChange={(e) => updateExperience(idx, 'to', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-sm font-semibold mb-1">Key Responsibilities</label>
                                        <textarea value={exp.desc} onChange={(e) => updateExperience(idx, 'desc', e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                                    </div>
                                    {experiences.length > 1 && (
                                        <button type="button" onClick={() => removeExperience(idx)} className="mt-2 flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-semibold">
                                            <Trash2 className="w-4 h-4" /> Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={addExperience} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold">
                                <Plus className="w-4 h-4" /> Add Another Experience
                            </button>
                        </section>

                        {/* References */}
                        <section className="border-t border-gray-200 pt-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">6) Character References</h2>
                            {references.map((ref, idx) => (
                                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Full Name <span className="text-red-600">*</span></label>
                                            <input required value={ref.name} onChange={(e) => updateReference(idx, 'name', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Relationship <span className="text-red-600">*</span></label>
                                            <input required value={ref.relation} onChange={(e) => updateReference(idx, 'relation', e.target.value)} placeholder="e.g., Former Supervisor" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Company/Organization</label>
                                            <input value={ref.company} onChange={(e) => updateReference(idx, 'company', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Email Address</label>
                                            <input type="email" value={ref.email} onChange={(e) => updateReference(idx, 'email', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Contact Number <span className="text-red-600">*</span></label>
                                            <input required value={ref.contact} onChange={(e) => updateReference(idx, 'contact', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                        </div>
                                    </div>
                                    {references.length > 1 && (
                                        <button type="button" onClick={() => removeReference(idx)} className="mt-2 flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-semibold">
                                            <Trash2 className="w-4 h-4" /> Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={addReference} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold">
                                <Plus className="w-4 h-4" /> Add Another Reference
                            </button>
                        </section>

                        {/* Additional Message */}
                        <section className="border-t border-gray-200 pt-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">7) Cover Letter / Additional Information</h2>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows={6}
                                placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            ></textarea>
                        </section>

                        {/* Consent */}
                        <section className="border-t border-gray-200 pt-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={consent}
                                        onChange={(e) => setConsent(e.target.checked)}
                                        className="mt-1 w-5 h-5 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">
                                        <strong>Data Privacy Consent:</strong> I hereby authorize Universidad De Manila to collect, process, and store my personal information for recruitment purposes. I understand that my data will be handled in accordance with the Data Privacy Act of 2012.
                                    </span>
                                </label>
                            </div>
                        </section>

                        {/* Submit Button */}
                        <div className="flex gap-4 pt-6">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !consent}
                                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
                            >
                                {submitting ? 'Submitting Application...' : 'Submit Application'}
                            </button>
                        </div>
                    </form>
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