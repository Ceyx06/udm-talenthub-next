// app/apply/page.tsx
import { Suspense } from 'react';
import ApplyPageContent from './ApplyPageContent';

// Disable static generation completely
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ApplyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application form...</p>
        </div>
      </div>
    }>
      <ApplyPageContent />
    </Suspense>
  );
}