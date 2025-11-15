'use client';

import { useSession } from 'next-auth/react';

export default function ApplicantsTestPage() {
  const { data: session, status } = useSession();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Session Debug</h1>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Session:</strong></p>
        <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      {status === 'authenticated' && session?.user && (
        <div className="mt-4 bg-green-50 p-4 rounded-lg">
          <p><strong>✅ You are logged in as:</strong></p>
          <p>Name: {session.user.name}</p>
          <p>Email: {session.user.email}</p>
          <p>Role: {session.user.role}</p>
        </div>
      )}

      {status === 'unauthenticated' && (
        <div className="mt-4 bg-red-50 p-4 rounded-lg">
          <p>❌ You are NOT logged in</p>
          <a href="/login" className="text-blue-600 underline">Go to Login</a>
        </div>
      )}
    </div>
  );
}