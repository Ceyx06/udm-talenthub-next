'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  college: string | null;
  status: string;
  description: string | null;
  requirements: string | null;
  postedDate: Date;
}

interface Experience {
  employer: string;
  jobTitle: string;
  from: string;
  to: string;
  responsibilities: string;
}

interface Reference {
  name: string;
  position: string;
  company: string;
  email: string;
  contactNumber: string;
}

// Create a separate component that uses useSearchParams
function ApplyPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const vacancyId = searchParams.get('vacancy');
  
  const [job, setJob] = useState<Job | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Form states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    contactNo: '',
    dob: '',
    gender: '',
    civilStatus: '',
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
    coverLetter: '',
  });

  const [files, setFiles] = useState({
    pds: null as File | null,
    transcript: null as File | null,
    trainings: null as File | null,
    employment: null as File | null,
  });

  const [experiences, setExperiences] = useState<Experience[]>([
    { employer: '', jobTitle: '', from: '', to: '', responsibilities: '' }
  ]);

  const [references, setReferences] = useState<Reference[]>([
    { name: '', position: '', company: '', email: '', contactNumber: '' }
  ]);

  // Calculate age from date of birth
  const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Get maximum date (today)
  const getMaxDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get minimum date (for 21 years old minimum)
  const getMinDate = (): string => {
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    return minDate.toISOString().split('T')[0];
  };

  // Get suggested max date for legal age (21 years ago)
  const getSuggestedMaxDate = (): string => {
    const today = new Date();
    const suggestedDate = new Date(today.getFullYear() - 21, today.getMonth(), today.getDate());
    return suggestedDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (!vacancyId) {
      setPageError('No vacancy ID provided');
      setPageLoading(false);
      return;
    }

    fetchVacancy();
  }, [vacancyId]);

  const fetchVacancy = async () => {
    try {
      setPageLoading(true);
      setPageError(null);

      const response = await fetch(`/api/hr/vacancies/${vacancyId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch vacancy details');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setJob(result.data);
        setFormData(prev => ({
          ...prev,
          desiredPosition: result.data.title,
          department: result.data.college || '',
        }));
      } else {
        throw new Error('Vacancy not found');
      }
    } catch (err: any) {
      console.error('Error fetching vacancy:', err);
      setPageError(err.message || 'Failed to load vacancy');
    } finally {
      setPageLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special validation for date of birth
    if (name === 'dob') {
      const age = calculateAge(value);
      if (age < 21 && value) {
        setError('Applicant must be at least 21 years old to apply for a professorial position.');
      } else {
        setError('');
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof typeof files) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type for ${fieldName}. Only PDF, JPG, and PNG are allowed.`);
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert(`File too large. Maximum size is 5MB.`);
        return;
      }
    }
    
    setFiles(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  const addExperience = () => {
    setExperiences([...experiences, { employer: '', jobTitle: '', from: '', to: '', responsibilities: '' }]);
  };

  const removeExperience = (index: number) => {
    if (experiences.length > 1) {
      setExperiences(experiences.filter((_, i) => i !== index));
    }
  };

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    setExperiences(updated);
  };

  const addReference = () => {
    setReferences([...references, { name: '', position: '', company: '', email: '', contactNumber: '' }]);
  };

  const removeReference = (index: number) => {
    if (references.length > 1) {
      setReferences(references.filter((_, i) => i !== index));
    }
  };

  const updateReference = (index: number, field: keyof Reference, value: string) => {
    const updated = [...references];
    updated[index] = { ...updated[index], [field]: value };
    setReferences(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!job) {
      setError('Job information not loaded');
      return;
    }

    // Validate age
    const age = calculateAge(formData.dob);
    if (age < 21) {
      setError('Applicant must be at least 21 years old to apply for a professorial position.');
      return;
    }

    if (!consentChecked) {
      setError('You must agree to the Data Privacy Act consent');
      return;
    }

    setLoading(true);
    setError('');

    if (!files.pds || !files.transcript || !files.trainings || !files.employment) {
      setError('All required documents must be uploaded');
      setLoading(false);
      return;
    }

    // Validate work experience
    const hasValidExperience = experiences.some(exp => 
      exp.employer && exp.jobTitle && exp.from && exp.to && exp.responsibilities
    );
    if (!hasValidExperience) {
      setError('At least one complete work experience entry is required (≥ 2 years relevant)');
      setLoading(false);
      return;
    }

    // Validate references
    const hasValidReference = references.some(ref => 
      ref.name && ref.position
    );
    if (!hasValidReference) {
      setError('At least one character reference is required');
      setLoading(false);
      return;
    }

    try {
      const uploadFile = async (file: File, fieldName: string) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Failed to upload ${fieldName}`);
        }
        
        const result = await response.json();
        return result.url;
      };

      setError('Uploading documents...');
      
      const [pdsUrl, transcriptUrl, trainingsUrl, employmentUrl] = await Promise.all([
        uploadFile(files.pds, 'PDS'),
        uploadFile(files.transcript, 'Transcript'),
        uploadFile(files.trainings, 'Trainings'),
        uploadFile(files.employment, 'Employment'),
      ]);

      setError('Submitting application...');

      const submitData = {
        vacancyId: job.id,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        fullName: `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim(),
        email: formData.email,
        contactNo: formData.contactNo,
        dob: formData.dob || undefined,
        gender: formData.gender || undefined,
        civilStatus: formData.civilStatus || undefined,
        presentAddress: formData.presentAddress || undefined,
        permanentAddress: formData.permanentAddress || undefined,
        nationality: formData.nationality || undefined,
        desiredPosition: formData.desiredPosition,
        department: formData.department,
        employmentType: formData.employmentType,
        highestDegree: formData.highestDegree || undefined,
        trainingHours: formData.trainingHours ? Number(formData.trainingHours) : undefined,
        licenseName: formData.licenseName || undefined,
        licenseNo: formData.licenseNo || undefined,
        licenseExpiry: formData.licenseExpiry || undefined,
        coverLetter: formData.coverLetter || undefined,
        experiences: experiences.filter(exp => exp.employer && exp.jobTitle),
        references: references.filter(ref => ref.name && ref.position),
        pdsUrl,
        transcriptUrl,
        trainingsUrl,
        employmentUrl,
        resumeUrl: pdsUrl,
      };

      const response = await fetch('/api/application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to submit application');
      }

      const result = await response.json();
      
      alert(`Application submitted successfully! Your QR Code: ${result.qrCode}`);
      router.push('/jobs');
      
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vacancy details...</p>
        </div>
      </div>
    );
  }

  if (pageError || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vacancy Not Found</h2>
          <p className="text-gray-600 mb-6">{pageError || 'The job posting you are looking for does not exist or has been removed.'}</p>
          <Link
            href="/jobs"
            className="inline-block px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
          >
            View All Jobs
          </Link>
        </div>
      </div>
    );
  }

  const currentAge = calculateAge(formData.dob);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Apply for {job.title}</h1>
          <p className="text-gray-600">{job.college}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">1) Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="contactNo"
                  required
                  value={formData.contactNo}
                  onChange={handleInputChange}
                  placeholder="+63"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(Must be 21 years or older)</span>
                </label>
                <input
                  type="date"
                  name="dob"
                  required
                  value={formData.dob}
                  onChange={handleInputChange}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formData.dob && currentAge < 21 ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {formData.dob && (
                  <p className={`mt-1 text-sm ${currentAge >= 21 ? 'text-green-600' : 'text-red-600'}`}>
                    {currentAge >= 21 ? `✓ Age: ${currentAge} years old` : `✗ Age: ${currentAge} years old (Minimum: 21 years)`}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Civil Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="civilStatus"
                  required
                  value={formData.civilStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nationality <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nationality"
                  required
                  value={formData.nationality}
                  onChange={handleInputChange}
                  placeholder="e.g., Filipino"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Address Information Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">2) Address Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Present Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="presentAddress"
                  required
                  value={formData.presentAddress}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permanent Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="permanentAddress"
                  required
                  value={formData.permanentAddress}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Position & Employment Type Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">3) Position & Employment Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desired Position <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="desiredPosition"
                  required
                  value={formData.desiredPosition}
                  onChange={handleInputChange}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="employmentType"
                  required
                  value={formData.employmentType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contractual">Contractual</option>
                </select>
              </div>
            </div>
          </section>

          {/* Education Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">4) Education</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Highest Degree <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="highestDegree"
                  required
                  value={formData.highestDegree}
                  onChange={handleInputChange}
                  placeholder="e.g., Bachelor of Science in Computer Science"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Training Hours
                </label>
                <input
                  type="number"
                  name="trainingHours"
                  value={formData.trainingHours}
                  onChange={handleInputChange}
                  placeholder="Total hours"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Name
                </label>
                <input
                  type="text"
                  name="licenseName"
                  value={formData.licenseName}
                  onChange={handleInputChange}
                  placeholder="e.g., Professional Teacher License"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Number
                </label>
                <input
                  type="text"
                  name="licenseNo"
                  value={formData.licenseNo}
                  onChange={handleInputChange}
                  placeholder="License number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Expiry
              </label>
              <input
                type="date"
                name="licenseExpiry"
                value={formData.licenseExpiry}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </section>

          {/* Work Experience Section */}
          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">
              5) Work Experience (≥ 2 years relevant) <span className="text-red-500">*</span>
            </h2>
            <p className="text-sm text-gray-600 mb-4">Add past roles with dates and key responsibilities.</p>
            
            {experiences.map((exp, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employer <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={exp.employer}
                      onChange={(e) => updateExperience(index, 'employer', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={exp.jobTitle}
                      onChange={(e) => updateExperience(index, 'jobTitle', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="month"
                      value={exp.from}
                      onChange={(e) => updateExperience(index, 'from', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="MM/YYYY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="month"
                      value={exp.to}
                      onChange={(e) => updateExperience(index, 'to', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="MM/YYYY"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Responsibilities <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={exp.responsibilities}
                    onChange={(e) => updateExperience(index, 'responsibilities', e.target.value)}
                    rows={3}
                    placeholder="Describe your main responsibilities and achievements"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {experiences.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Remove Experience
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addExperience}
              className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
            >
              + Add Experience
            </button>
          </section>

          {/* Character References Section */}
          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">
              6) Character References <span className="text-red-500">*</span>
            </h2>
            <p className="text-sm text-gray-600 mb-4">At least one professional reference is required.</p>
            
            {references.map((ref, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ref.name}
                      onChange={(e) => updateReference(index, 'name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position / Relation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ref.position}
                      onChange={(e) => updateReference(index, 'position', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      value={ref.company}
                      onChange={(e) => updateReference(index, 'company', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={ref.email}
                      onChange={(e) => updateReference(index, 'email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                    <input
                      type="tel"
                      value={ref.contactNumber}
                      onChange={(e) => updateReference(index, 'contactNumber', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {references.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeReference(index)}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Remove Reference
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addReference}
              className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
            >
              + Add Reference
            </button>
          </section>

          {/* Required Documents Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">7) Required Documents</h2>
            <p className="text-sm text-gray-600 mb-4">Please upload the following required documents (PDF, JPG, or PNG format, max 5MB each)</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1. Personal Data Sheet / CV <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'pds')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {files.pds && <p className="mt-1 text-sm text-green-600">✓ {files.pds.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2. Transcript of Records <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'transcript')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {files.transcript && <p className="mt-1 text-sm text-green-600">✓ {files.transcript.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  3. Training Certificates <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'trainings')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {files.trainings && <p className="mt-1 text-sm text-green-600">✓ {files.trainings.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  4. Employment Certification <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'employment')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {files.employment && <p className="mt-1 text-sm text-green-600">✓ {files.employment.name}</p>}
              </div>
            </div>
          </section>

          {/* Applicant Consent Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">8) Applicant Consent</h2>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  required
                />
                <label htmlFor="consent" className="text-sm text-gray-700">
                  I certify that the information provided is true and correct, and I consent to the collection and processing of my personal data in accordance with the Data Privacy Act of 2012 (RA 10173). <span className="text-red-500">*</span>
                </label>
              </div>
            </div>
          </section>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading || !consentChecked || (formData.dob !== '' && currentAge < 21)}
              className="flex-1 bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/jobs')}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main component with Suspense wrapper
export default function ApplyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ApplyPageContent />
    </Suspense>
  );
}