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
    
    try {
      // Get the token from NextAuth
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        // For development, use http cookies
        secureCookie: process.env.NODE_ENV === 'production',
      });

      console.log('Middleware - Pathname:', request.nextUrl.pathname);
      console.log('Middleware - Token exists:', !!token);
      console.log('Middleware - Token role:', token?.role);

      // If no token, redirect to login
      if (!token) {
        console.log('Middleware - No token found, redirecting to login');
        const loginUrl = new URL('/login', request.url);
        // Add the original URL as a callback parameter
        loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check if user has the right role
      const userRole = (token.role as string)?.toUpperCase();
      console.log('Middleware - User role:', userRole);
      
      if (request.nextUrl.pathname.startsWith('/hr/')) {
        if (userRole !== 'HR') {
          console.log('Middleware - Wrong role for HR route');
          return NextResponse.redirect(new URL('/access-denied', request.url));
        }
      }
      
      if (request.nextUrl.pathname.startsWith('/dean/')) {
        if (userRole !== 'DEAN') {
          console.log('Middleware - Wrong role for DEAN route, user role is:', userRole);
          return NextResponse.redirect(new URL('/access-denied', request.url));
        }
      }

      console.log('Middleware - Auth successful, allowing access');
    } catch (error) {
      console.error('Middleware - Error getting token:', error);
      // On error, allow the request through and let the page handle auth
      // This prevents blocking legitimate requests
      return NextResponse.next();
    }
  }

 // Handle authentication for applicant routes
if (request.nextUrl.pathname.startsWith('/applicant/')) {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    });

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    console.error('Middleware - Error in applicant route:', error);
    return NextResponse.next();
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