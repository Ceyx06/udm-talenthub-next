import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface JobPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getJobDetails(id: string) {
  try {
    const cutoff = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

    // Debug: Log the query parameters
    console.log('Searching for job:', {
      id,
      cutoff: cutoff.toISOString(),
      now: new Date().toISOString()
    });

    // Try finding with ANY status first to debug
    const anyJob = await prisma.vacancy.findUnique({
      where: { id },
      select: { id: true, status: true, postedDate: true }
    });
    console.log('Job exists (any status):', anyJob);

    const vacancy = await prisma.vacancy.findFirst({
      where: {
        id,
        // Try both "OPEN" and "Active" status
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

    console.log('Job found:', vacancy ? 'Yes' : 'No', vacancy?.id);
    return vacancy;
  } catch (error) {
    console.error('Error fetching job:', error);
    return null;
  }
}

export default async function JobPage(props: JobPageProps) {
  const params = await props.params;
  const job = await getJobDetails(params.id);

  if (!job) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              UDM
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Universidad De Manila</h1>
              <p className="text-sm text-gray-600">HR Portal</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Job Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Status Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                <span className="font-semibold">Now Hiring</span>
              </div>
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                {job.college}
              </span>
            </div>
          </div>

          {/* Job Details */}
          <div className="p-8">
            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {job.title}
            </h2>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Posted: {new Date(job.postedDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Quezon City, Metro Manila</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Expires in 15 days</span>
              </div>
            </div>

            {/* Requirements Section */}
            {job.requirements && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Requirements
                </h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                </div>
              </div>
            )}

            {/* Description/Additional Info */}
            {job.description && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Job Description
                </h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                </div>
              </div>
            )}

            {/* Apply Button */}
            <div className="mt-8 pt-8 border-t">
              <a
                href={`/apply?vacancy=${job.id}`}
                className="block w-full bg-gradient-to-r from-blue-900 to-indigo-800 text-white text-center py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-800 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Apply for this Position →
              </a>
              <p className="text-center text-sm text-gray-500 mt-4">
                Click to submit your application
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-3">About Universidad De Manila</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Universidad De Manila is a premier educational institution committed to academic excellence
            and student success. We offer competitive compensation, professional development opportunities,
            and a supportive work environment.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-gray-600">
        <p>© 2025 Universidad De Manila. All rights reserved.</p>
        <p className="mt-2">
          Questions? Contact us at <a href="mailto:hr@udm.edu.ph" className="text-blue-900 hover:underline">hr@udm.edu.ph</a>
        </p>
      </footer>
    </div>
  );
}