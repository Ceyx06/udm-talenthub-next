'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Job {
  id: string;
  title: string;
  college: string;
  description?: string;
  requirements?: string;
}

interface ApplyFormProps {
  job: Job;
}

interface Experience {
  employer: string;
  jobTitle: string;
  from: string;
  to: string;
  responsibilities: string;
}

export default function ApplyForm({ job }: ApplyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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
    desiredPosition: job.title,
    department: job.college,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
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

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  // Validate files
  if (!files.pds || !files.transcript || !files.trainings || !files.employment) {
    setError('All required documents must be uploaded');
    setLoading(false);
    return;
  }

  try {
    // Upload files first
    const uploadFile = async (file: File, fieldName: string) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload ${fieldName}`);
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

    // Prepare data with file URLs
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
      experiences: experiences,
      references: [],
      // File URLs
      pdsUrl,
      transcriptUrl,
      trainingsUrl,
      employmentUrl,
      resumeUrl: pdsUrl, // Use PDS as resume
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
          {/* Personal Information */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Personal Information</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Civil Status</label>
                <select
                  name="civilStatus"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  placeholder="e.g., Filipino"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Address */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Address Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Present Address</label>
                <input
                  type="text"
                  name="presentAddress"
                  value={formData.presentAddress}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permanent Address</label>
                <input
                  type="text"
                  name="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Education & Qualifications */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Education & Qualifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Highest Degree</label>
                <input
                  type="text"
                  name="highestDegree"
                  value={formData.highestDegree}
                  onChange={handleInputChange}
                  placeholder="e.g., Bachelor's Degree"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Training Hours</label>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">License Name</label>
                <input
                  type="text"
                  name="licenseName"
                  value={formData.licenseName}
                  onChange={handleInputChange}
                  placeholder="e.g., PRC License"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                <input
                  type="text"
                  name="licenseNo"
                  value={formData.licenseNo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">License Expiry</label>
                <input
                  type="date"
                  name="licenseExpiry"
                  value={formData.licenseExpiry}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Work Experience */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Work Experience</h2>
            {experiences.map((exp, index) => (
              <div key={index} className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{index + 1}) Work Experience</h3>
                  {experiences.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExperience(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employer <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={exp.employer}
                      onChange={(e) => updateExperience(index, 'employer', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={exp.jobTitle}
                      onChange={(e) => updateExperience(index, 'jobTitle', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={exp.from}
                      onChange={(e) => updateExperience(index, 'from', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={exp.to}
                      onChange={(e) => updateExperience(index, 'to', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key Responsibilities</label>
                  <textarea
                    rows={4}
                    value={exp.responsibilities}
                    onChange={(e) => updateExperience(index, 'responsibilities', e.target.value)}
                    placeholder="Describe your key responsibilities and achievements..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addExperience}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-xl">+</span>
              <span>Add Experience</span>
            </button>
          </section>

          {/* Required Documents */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Required Documents</h2>
            <p className="text-sm text-gray-600 mb-4">Please upload the following required documents (PDF, JPG, or PNG format, max 5MB each)</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1. Fully accomplished Personal Data Sheet / Curriculum Vitae <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'pds')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {files.pds && (
                  <p className="mt-1 text-sm text-green-600">✓ {files.pds.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2. Certified True Copy of Transcript of Records <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'transcript')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {files.transcript && (
                  <p className="mt-1 text-sm text-green-600">✓ {files.transcript.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  3. Certified True Copy of Certificate of Trainings Attended <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'trainings')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {files.trainings && (
                  <p className="mt-1 text-sm text-green-600">✓ {files.trainings.name}</p>
                )}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {files.employment && (
                  <p className="mt-1 text-sm text-green-600">✓ {files.employment.name}</p>
                )}
              </div>
            </div>
          </section>

          {/* Cover Letter */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Cover Letter</h2>
            <textarea
              name="coverLetter"
              rows={6}
              value={formData.coverLetter}
              onChange={handleInputChange}
              placeholder="Tell us why you're interested in this position and what makes you a great fit..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </section>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
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