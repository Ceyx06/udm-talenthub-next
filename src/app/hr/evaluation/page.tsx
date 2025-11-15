// src/app/hr/evaluation/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EvaluationModal from '@/components/hr/EvaluationModal';

interface Applicant {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  desiredPosition?: string;
  department?: string;
  stage?: string;
  status?: string;
  fileStatus?: string;
  vacancy?: {
    id: string;
    title: string;
    college: string;
  };
  pdsUrl?: string;
  transcriptUrl?: string;
  trainingsUrl?: string;
  employmentUrl?: string;
}

export default function EvaluationPage() {
  const router = useRouter();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Check authentication
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/');
      return;
    }
    
    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/');
    }
  }, [router]);

  // Fetch applicants for evaluation
  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const response = await fetch('/api/application?include=vacancy');
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch applications');
        }
        
        const data = await response.json();
        console.log('Fetched applications:', data);
        
        // Handle both response formats (array or object with data property)
        const applications = Array.isArray(data) ? data : (data.data || []);
        
        // Filter for applicants ready for evaluation
        // You can adjust this filter based on your workflow
        let eligibleApplicants = applications.filter(
          (app: Applicant) => 
            // Applicants who have completed interviews or are approved
            app.stage === 'INTERVIEW_COMPLETED' || 
            app.stage === 'DEMO_COMPLETED' ||
            app.status === 'APPROVED' ||
            // Or applicants with complete files ready for evaluation
            (app.fileStatus === 'complete' && app.stage !== 'HIRED')
        );
        
        // If no applicants match the filter, show all non-hired applicants for testing
        if (eligibleApplicants.length === 0) {
          console.log('No applicants match strict criteria, showing all non-hired applicants');
          eligibleApplicants = applications.filter(
            (app: Applicant) => app.stage !== 'HIRED' && app.stage !== 'REJECTED'
          );
        }
        
        console.log('Eligible applicants for evaluation:', eligibleApplicants);
        setApplicants(eligibleApplicants);
      } catch (error: any) {
        console.error('Error fetching applicants:', error);
        alert('Failed to load applicants: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchApplicants();
    }
  }, [user]);

  const handleEvaluate = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setIsModalOpen(true);
  };

  const handleEvaluationComplete = () => {
    // Refresh the list after evaluation
    setIsModalOpen(false);
    setSelectedApplicant(null);
    // Reload applicants
    window.location.reload();
  };

  const getFileStatusBadge = (status?: string) => {
    if (status === 'complete') {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Complete</span>;
    } else if (status === 'partial') {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Partial</span>;
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Pending</span>;
    }
  };

  const getStageBadge = (stage?: string) => {
    const stageColors: Record<string, string> = {
      'APPLIED': 'bg-blue-100 text-blue-800',
      'INTERVIEW_SCHEDULED': 'bg-purple-100 text-purple-800',
      'INTERVIEW_COMPLETED': 'bg-indigo-100 text-indigo-800',
      'DEMO_COMPLETED': 'bg-cyan-100 text-cyan-800',
      'EVALUATING': 'bg-yellow-100 text-yellow-800',
      'HIRED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
    };

    const colorClass = stageColors[stage || ''] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colorClass}`}>
        {stage || 'N/A'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applicants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Evaluation</h1>
          <p className="text-gray-600 mt-1">Review and evaluate applicants</p>
        </div>

        {/* Applicants Table */}
        {applicants.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">No applicants ready for evaluation</p>
            <p className="text-gray-500 text-sm mt-2">
              Applicants will appear here once they complete their interviews or document submissions.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    College
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Files
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applicants.map((applicant) => (
                  <tr key={applicant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {applicant.fullName}
                          </div>
                          <div className="text-sm text-gray-500">{applicant.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {applicant.vacancy?.college || applicant.department || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {applicant.vacancy?.title || applicant.desiredPosition || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getFileStatusBadge(applicant.fileStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStageBadge(applicant.stage)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEvaluate(applicant)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Evaluate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Applicants</p>
            <p className="text-2xl font-bold text-gray-900">{applicants.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Files Complete</p>
            <p className="text-2xl font-bold text-green-600">
              {applicants.filter(a => a.fileStatus === 'complete').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Pending Evaluation</p>
            <p className="text-2xl font-bold text-yellow-600">
              {applicants.filter(a => a.stage !== 'HIRED' && a.stage !== 'REJECTED').length}
            </p>
          </div>
        </div>
      </div>

      {/* Evaluation Modal */}
      <EvaluationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        applicant={selectedApplicant}
        evaluatedBy={user?.id || user?.email || 'Unknown'}
        onComplete={handleEvaluationComplete}
      />
    </div>
  );
}