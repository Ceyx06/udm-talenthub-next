// app/hr/applicants/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ApplicantsTable from '@/components/hr/ApplicantsTable';
import ViewApplicantModal from '@/components/hr/ViewApplicantModal';
import ScheduleInterviewModal, { InterviewScheduleData } from '@/components/hr/ScheduleInterviewModal';
import { Application } from '@/types/application';

export default function ApplicantsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { router.push('/login'); return; }
    try {
      const userData = JSON.parse(userStr);
      const userRole = userData.role?.toUpperCase();
      if (userRole !== 'HR') {
        alert(`Access denied. Your role is: ${userData.role}. Only HR users can access this page.`);
        router.push('/login');
        return;
      }
      setUser(userData);
      setLoading(false);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [router]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/application');
      const data = await response.json();
      if (data.success) { setApplications(data.data); }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role) { fetchApplications(); }
  }, [user]);

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application);
    setIsViewModalOpen(true);
  };

  const handleScheduleInterview = (application: Application) => {
    setSelectedApplication(application);
    setIsScheduleModalOpen(true);
  };

  const handleSubmitSchedule = async (scheduleData: InterviewScheduleData) => {
    if (!selectedApplication) return;
    try {
      const response = await fetch(`/api/application/${selectedApplication.id}/schedule-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      });
      const data = await response.json();
      if (data.success) {
        alert('Interview scheduled successfully!');
        fetchApplications();
        setIsScheduleModalOpen(false);
        setSelectedApplication(null);
      } else {
        alert(data.error || 'Failed to schedule interview');
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
      alert('Failed to schedule interview');
    }
  };

  const handleEndorseToDean = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/application/${applicationId}/endorse`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRole: 'HR' })
      });
      const data = await response.json();
      if (data.success) {
        alert('Application endorsed to Dean successfully! Waiting for Dean approval.');
        fetchApplications();
        setIsViewModalOpen(false);
      } else {
        alert(data.error || 'Failed to endorse application');
      }
    } catch (error) {
      console.error('Error endorsing application:', error);
      alert('Failed to endorse application');
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    try {
      const response = await fetch(`/api/application/${applicationId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        alert('Application deleted successfully!');
        fetchApplications();
      } else {
        alert(data.error || 'Failed to delete application');
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Failed to delete application');
    }
  };

  const handleUpdateFileStatus = async (applicationId: string, fileStatus: string) => {
    try {
      const response = await fetch(`/api/application/${applicationId}/files`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileStatus })
      });
      const data = await response.json();
      if (data.success) {
        fetchApplications();
        if (selectedApplication?.id === applicationId) {
          setSelectedApplication(data.data);
        }
      }
    } catch (error) {
      console.error('Error updating file status:', error);
    }
  };

  const filteredApplications = applications.filter(app => {
    const stageMatch = filterStage === 'all' || app.stage === filterStage;
    const statusMatch = filterStatus === 'all' || app.status === filterStatus;
    return stageMatch && statusMatch;
  });

  // ✅ Count applications by stage
  const endorsedCount = applications.filter(a => a.stage === 'ENDORSED').length;
  const pendingDeanCount = applications.filter(a => a.stage === 'PENDING_DEAN_APPROVAL').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Applicants Management</h1>
          <p className="text-gray-600 mt-2">Review and manage job applications</p>
          <p className="text-xs text-gray-500 mt-1">Logged in as: {user.name} ({user.role})</p>
        </div>

        {/* ✅ Alert for applications pending Dean approval */}
        {pendingDeanCount > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="font-semibold text-orange-900">
                  {pendingDeanCount} application{pendingDeanCount > 1 ? 's' : ''} pending Dean approval
                </p>
                <p className="text-sm text-orange-700">
                  Waiting for Dean to approve before interview can be scheduled.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Alert for endorsed applications (Dean approved) */}
        {endorsedCount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-green-900">
                  {endorsedCount} application{endorsedCount > 1 ? 's' : ''} approved by Dean
                </p>
                <p className="text-sm text-green-700">
                  Ready for interview scheduling. Filter by "Endorsed" stage to schedule interviews.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Stage</label>
              {/* ✅ Updated filter options */}
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Stages</option>
                <option value="APPLIED">Applied</option>
                <option value="PENDING">Pending</option>
                <option value="PENDING_DEAN_APPROVAL">Pending Dean Approval</option>
                <option value="ENDORSED">Endorsed (Ready for Interview)</option>
                <option value="DISAPPROVED">Disapproved by Dean</option>
                <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                <option value="EVALUATED">Evaluated</option>
                <option value="FOR_HIRING">For Hiring</option>
                <option value="HIRED">Hired</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="READY_FOR_INTERVIEW">Ready for Interview</option>
                <option value="ENDORSED">Endorsed</option>
                <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                <option value="EVALUATED">Evaluated</option>
                <option value="FOR_HIRING">For Hiring</option>
                <option value="HIRED">Hired</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchApplications}
                className="w-full px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ✅ Stats Cards - Now 5 columns with Pending Dean */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Applications</p>
            <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-600">
              {applications.filter(a => a.stage === 'PENDING' || a.stage === 'APPLIED').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Pending Dean</p>
            <p className="text-2xl font-bold text-orange-600">{pendingDeanCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Ready for Interview</p>
            <p className="text-2xl font-bold text-blue-600">{endorsedCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Hired</p>
            <p className="text-2xl font-bold text-green-600">
              {applications.filter(a => a.stage === 'HIRED').length}
            </p>
          </div>
        </div>

        {/* Applications Table */}
        <ApplicantsTable
          applications={filteredApplications}
          onView={handleViewApplication}
          onDelete={handleDeleteApplication}
          onScheduleInterview={handleScheduleInterview}
          onRefresh={fetchApplications}
        />

        {/* View Application Modal */}
        {selectedApplication && (
          <ViewApplicantModal
            isOpen={isViewModalOpen}
            onClose={() => { setIsViewModalOpen(false); setSelectedApplication(null); }}
            application={selectedApplication}
            onEndorse={handleEndorseToDean}
            onUpdateFileStatus={handleUpdateFileStatus}
            onScheduleInterview={() => { setIsViewModalOpen(false); setIsScheduleModalOpen(true); }}
          />
        )}

        {/* Schedule Interview Modal */}
        {selectedApplication && selectedApplication.vacancy && (
          <ScheduleInterviewModal
            isOpen={isScheduleModalOpen}
            onClose={() => { setIsScheduleModalOpen(false); setSelectedApplication(null); }}
            application={{
              id: selectedApplication.id,
              fullName: selectedApplication.fullName,
              email: selectedApplication.email,
              vacancy: selectedApplication.vacancy as { title: string; college: string }
            }}
            onSchedule={handleSubmitSchedule}
          />
        )}
      </div>
    </div>
  );
}