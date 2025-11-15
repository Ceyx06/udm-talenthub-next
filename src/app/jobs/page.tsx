'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Clock, Briefcase, GraduationCap, ExternalLink, AlertCircle } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  department: string;
  requirements: string;
  description: string;
  postedDate: string;
  daysAgo: string;
  status: string;
  link: string;
  isExpired?: boolean;
  daysSincePosted?: number;
}

export default function PublicJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'expired'>('active');
  const [loading, setLoading] = useState(true);

  // Fetch jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/public-jobs');
        if (!response.ok) throw new Error('Failed to fetch jobs');
        const data = await response.json();
        
        setJobs(data);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const departments = ['all', ...new Set(jobs.map(job => job.department))];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || job.department === selectedDepartment;
    
    // Filter by status
    let matchesStatus = true;
    if (selectedStatus === 'active') {
      matchesStatus = !job.isExpired && job.status === 'Active';
    } else if (selectedStatus === 'expired') {
      matchesStatus = job.isExpired === true;
    }
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Count active and expired jobs
  const activeJobsCount = jobs.filter(j => !j.isExpired && j.status === 'Active').length;
  const expiredJobsCount = jobs.filter(j => j.isExpired).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e8f4ef' }}>
      {/* Responsive meta viewport - handled by Next.js but ensure it's set */}
      <style>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          overflow-x: hidden;
        }
      `}</style>

      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10" style={{ borderColor: '#d4e5df' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#6b9d8a' }}>
              <span className="text-white font-bold text-xs sm:text-sm">UDM</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 truncate">Universidad De Manila</h1>
              <p className="text-xs sm:text-sm text-gray-600">Career Opportunities</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="text-white py-6 sm:py-10 md:py-12 lg:py-16" style={{ background: 'linear-gradient(to right, #7bad9a, #8bbdaa, #9bcdba)' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 md:mb-4">Join Our Team</h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 md:mb-8 px-2" style={{ color: '#f0faf5' }}>Discover exciting career opportunities at Universidad De Manila</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm md:text-base" style={{ color: '#f0faf5' }}>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{activeJobsCount} Open Positions</span>
            </div>
            {expiredJobsCount > 0 && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{expiredJobsCount} Expired</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 -mt-4 sm:-mt-6 md:-mt-8">
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-5 lg:p-6 border" style={{ borderColor: '#d4e5df' }}>
          <div className="grid grid-cols-1 gap-2.5 sm:gap-3 md:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 sm:pl-9 md:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent bg-white"
                style={{ borderColor: '#d4e5df' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6b9d8a';
                  e.target.style.outline = 'none';
                  e.target.style.boxShadow = '0 0 0 3px rgba(107, 157, 138, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d4e5df';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent bg-white"
              style={{ borderColor: '#d4e5df' }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6b9d8a';
                e.target.style.outline = 'none';
                e.target.style.boxShadow = '0 0 0 3px rgba(107, 157, 138, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d4e5df';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="all">All Departments</option>
              {departments.filter(d => d !== 'all').map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'active' | 'expired')}
              className="w-full px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent bg-white"
              style={{ borderColor: '#d4e5df' }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6b9d8a';
                e.target.style.outline = 'none';
                e.target.style.boxShadow = '0 0 0 3px rgba(107, 157, 138, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d4e5df';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="active">Active ({activeJobsCount})</option>
              <option value="expired">Expired ({expiredJobsCount})</option>
              <option value="all">All Jobs ({jobs.length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 md:p-10 lg:p-12 text-center border" style={{ borderColor: '#d4e5df' }}>
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 border-b-2 mx-auto mb-3 sm:mb-4" style={{ borderColor: '#6b9d8a' }}></div>
            <p className="text-sm sm:text-base text-gray-500">Loading positions...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 md:p-10 lg:p-12 text-center border" style={{ borderColor: '#d4e5df' }}>
            <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-700 mb-2">No positions found</h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-500">
              {selectedStatus === 'expired' 
                ? 'No expired job postings at this time.' 
                : 'Try adjusting your search or filter criteria'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {filteredJobs.map((job) => {
              const isExpired = job.isExpired === true;
              
              return (
                <div 
                  key={job.id} 
                  className={`rounded-lg shadow-sm transition-all duration-200 overflow-hidden border ${
                    isExpired 
                      ? 'bg-gray-50 border-red-200' 
                      : 'bg-white hover:shadow-md'
                  }`}
                  style={!isExpired ? { borderColor: '#d4e5df' } : undefined}
                >
                  <div className="p-3 sm:p-4 md:p-5 lg:p-6">
                    <div className="flex flex-col gap-3 sm:gap-4">
                      {/* Job Header */}
                      <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4">
                        <div 
                          className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: isExpired ? '#d1d5db' : '#f0faf5' }}
                        >
                          <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: isExpired ? '#6b7280' : '#6b9d8a' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-1.5 sm:mb-2">
                            <h3 className={`text-base sm:text-lg md:text-xl font-bold break-words ${isExpired ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {job.title}
                            </h3>
                            {isExpired && (
                              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-100 text-red-700 rounded text-xs font-bold uppercase whitespace-nowrap flex-shrink-0">
                                <AlertCircle className="w-3 h-3" />
                                <span className="hidden sm:inline">EXPIRED</span>
                              </span>
                            )}
                          </div>
                          
                          {/* Job Details */}
                          <div className={`flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm ${isExpired ? 'text-gray-500' : 'text-gray-600'}`}>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="truncate">{job.department}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="truncate">{job.requirements}</span>
                            </div>
                            <div className="flex items-center gap-1 w-full sm:w-auto">
                              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span>Posted {job.postedDate}</span>
                            </div>
                            {job.daysSincePosted !== undefined && (
                              <div className={`flex items-center gap-1 ${
                                isExpired ? 'text-red-600 font-semibold' : 'text-gray-600'
                              }`}>
                                <span>({job.daysSincePosted} days old)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        {isExpired ? (
                          <>
                            <div className="bg-red-50 text-red-700 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-center border border-red-200">
                              CLOSED
                            </div>
                            <button
                              disabled
                              className="bg-gray-300 text-gray-600 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm md:text-base font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
                            >
                              Not Available
                              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-center border" style={{ 
                              backgroundColor: '#f0faf5', 
                              color: '#3d6f5d',
                              borderColor: '#d4e5df'
                            }}>
                              {job.daysAgo}
                            </div>
                            <Link
                              href={`/apply?vacancy=${job.id}`}
                              className="text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm md:text-base font-semibold flex items-center justify-center gap-2 transition-colors flex-1 sm:flex-initial"
                              style={{ backgroundColor: '#6b9d8a' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5b8c7a'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6b9d8a'}
                            >
                              Apply Now
                              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Expired Notice */}
                    {isExpired && (
                      <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs sm:text-sm text-red-700 font-medium flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                          <span>This position is no longer accepting applications. The 15-day posting period has ended on {job.postedDate}.</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-white py-6 sm:py-8 mt-8 sm:mt-12 md:mt-16 border-t" style={{ backgroundColor: '#4a7d6b', borderColor: '#5a8d7b' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-center">
          <p className="text-xs sm:text-sm md:text-base text-gray-200">© 2025 Universidad De Manila. All rights reserved.</p>
          <p className="text-xs sm:text-sm md:text-base text-gray-200 mt-2">
            Questions? Contact us at <a href="mailto:hr@udm.edu.ph" className="hover:text-opacity-80 break-all" style={{ color: '#b8e5d3' }}>hr@udm.edu.ph</a>
          </p>
        </div>
      </footer>
    </div>
  );
}