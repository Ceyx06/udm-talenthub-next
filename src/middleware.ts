import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  
  const allowedOrigins = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://udmhiringmanagement.pages.dev',
  ];

  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();

    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    return response;
  }

  // Handle authentication for HR and Dean routes
  if (request.nextUrl.pathname.startsWith('/hr/') || 
      request.nextUrl.pathname.startsWith('/dean/')) {
    
    // Get the token from NextAuth
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
    });

    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if user has the right role
    const userRole = token.role as string;
    
    if (request.nextUrl.pathname.startsWith('/hr/')) {
      if (userRole !== 'HR') {
        return NextResponse.redirect(new URL('/access-denied', request.url));
      }
    }
    
    if (request.nextUrl.pathname.startsWith('/dean/')) {
      if (userRole !== 'DEAN') {
        return NextResponse.redirect(new URL('/access-denied', request.url));
      }
    }
  }

  // Handle authentication for applicant routes
  if (request.nextUrl.pathname.startsWith('/applicant/')) {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
    });

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/hr/:path*',
    '/dean/:path*',
    '/applicant/:path*',
  ],
};