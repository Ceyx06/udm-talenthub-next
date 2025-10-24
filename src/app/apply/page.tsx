import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ApplyForm from '@/components/ApplyForm';

interface PageProps {
    searchParams: { vacancy?: string };
}

async function getVacancy(vacancyId: string) {
    const cutoff = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

    const vacancy = await prisma.vacancy.findFirst({
        where: {
            id: vacancyId,
            status: { in: ["OPEN", "Active"] },
            postedDate: { gte: cutoff }
        },
        select: {
            id: true,
            title: true,
            college: true,
            status: true,
            requirements: true,
            description: true,
            postedDate: true
        },
    });

    return vacancy;
}

async function ApplyPageContent({ searchParams }: PageProps) {
    const vacancyId = searchParams.vacancy;

    if (!vacancyId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="text-red-600 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">No Vacancy Specified</h1>
                    <p className="text-gray-600 mb-6">Please select a job posting to apply.</p>
                    <a href="/jobs" className="inline-block px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors">
                        View All Jobs
                    </a>
                </div>
            </div>
        );
    }

    const job = await getVacancy(vacancyId);

    if (!job) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="text-orange-600 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Closed</h1>
                    <p className="text-gray-600 mb-6">This job posting is no longer accepting applications or does not exist.</p>
                    <a href="/jobs" className="inline-block px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors">
                        View Other Opportunities
                    </a>
                </div>
            </div>
        );
    }

    // Check if expired (within 15 days and status is OPEN/Active)
    const postedDate = new Date(job.postedDate).getTime();
    const now = Date.now();
    const daysPassed = (now - postedDate) / (1000 * 60 * 60 * 24);
    const isExpired = daysPassed > 15 || (job.status !== 'OPEN' && job.status !== 'Active');

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

    return <ApplyForm job={job} />;
}

export default function ApplyPage({ searchParams }: PageProps) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <ApplyPageContent searchParams={searchParams} />
        </Suspense>
    );
}