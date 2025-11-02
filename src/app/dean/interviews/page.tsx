'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface Interview {
  id: string;
  interviewId: string;
  applicationId: string;
  interviewDate: string | null;
  teachingDemoDate: string | null;
  status: string;
  notes: string | null;
  application: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    desiredPosition: string;
    qrCode: string;
    vacancy: {
      title: string;
      college: string;
    };
  };
}

export default function InterviewDemoPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await fetch('/api/interviews');
      const data = await response.json();
      setInterviews(data);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateInterviewStatus = async (
    interviewId: string,
    status: string
  ) => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update interview');

      await fetchInterviews();

      const statusMessage = status === 'Completed'
        ? 'Interview marked as completed'
        : status === 'Endorsed'
          ? 'Applicant endorsed successfully'
          : `Interview status updated to ${status}`;

      alert(statusMessage);
    } catch (error) {
      console.error('Failed to update interview:', error);
      alert('Failed to update interview status');
    }
  };

  const setSchedule = async (interviewId: string) => {
    const interviewDateStr = prompt('Enter interview date (YYYY-MM-DD HH:MM):');
    const teachingDemoDateStr = prompt('Enter teaching demo date (YYYY-MM-DD HH:MM):');

    if (!interviewDateStr || !teachingDemoDateStr) return;

    try {
      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Scheduled',
          interviewDate: interviewDateStr,
          teachingDemoDate: teachingDemoDateStr,
        }),
      });

      if (!response.ok) throw new Error('Failed to set schedule');

      await fetchInterviews();
      alert('Schedule set successfully');
    } catch (error) {
      console.error('Failed to set schedule:', error);
      alert('Failed to set schedule');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const filteredInterviews = interviews.filter(
    (interview) =>
      interview.application.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interview.interviewId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interview.application.qrCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (interview.application.desiredPosition?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (interview.application.vacancy?.title?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Interview & Teaching Demo
        </h1>
        <p className="text-gray-600 mt-1">Schedule and manage interviews</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search applicants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interview Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teaching Demo Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInterviews.map((interview) => (
                <tr key={interview.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {interview.interviewId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {interview.application.fullName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {interview.application.desiredPosition || interview.application.vacancy?.title || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(interview.interviewDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(interview.teachingDemoDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${interview.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : interview.status === 'Scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : interview.status === 'Endorsed'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {interview.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {interview.status === 'Pending' && (
                      <button
                        onClick={() => setSchedule(interview.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      >
                        Set Schedule
                      </button>
                    )}
                    {interview.status === 'Scheduled' && (
                      <>
                        <button
                          onClick={() =>
                            updateInterviewStatus(interview.id, 'Completed')
                          }
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                          Mark Complete
                        </button>
                        <button
                          onClick={() =>
                            updateInterviewStatus(interview.id, 'Pending')
                          }
                          className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                        >
                          Mark Uncomplete
                        </button>
                      </>
                    )}
                    {interview.status === 'Completed' && (
                      <button
                        onClick={() =>
                          updateInterviewStatus(interview.id, 'Endorsed')
                        }
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                      >
                        Endorsed
                      </button>
                    )}
                    {interview.status === 'Endorsed' && (
                      <span className="px-3 py-1 text-xs text-gray-500">
                        Applicant Endorsed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInterviews.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'No interviews found matching your search' : 'No interviews scheduled yet'}
          </div>
        )}
      </div>
    </div>
  );
}