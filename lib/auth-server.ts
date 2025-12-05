import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = '24h'; // 24 hours

export interface AuthTokenPayload {
  authenticated: boolean;
  timestamp: number;
}

/**
 * Creates a JWT token for authenticated admin sessions
 */
export function createAuthToken(): string {
  const payload: AuthTokenPayload = {
    authenticated: true,
    timestamp: Date.now(),
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifies a JWT token and returns the payload if valid
 */
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Gets the auth token from the request (cookie or Authorization header)
 */
export function getAuthTokenFromRequest(request: NextRequest): string | null {
  // Check cookie first
  const cookieToken = request.cookies.get('admin_auth_token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Check Authorization header as fallback
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Middleware to check if request is authenticated
 * Returns null if authenticated, or a NextResponse with error if not
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const token = getAuthTokenFromRequest(request);
  
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const payload = verifyAuthToken(token);
  
  if (!payload || !payload.authenticated) {
    return NextResponse.json(
      { error: 'Invalid or expired authentication token' },
      { status: 401 }
    );
  }

  return null; // Authenticated
}

/**
 * Sets the auth token as a secure httpOnly cookie
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set('admin_auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

/**
 * Clears the auth cookie
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set('admin_auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

