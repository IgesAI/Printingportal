import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = '24h'; // 24 hours

const appOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin : null;
  } catch {
    return null;
  }
})();

function getOriginFromRequest(request: NextRequest): string | null {
  const headerOrigin = request.headers.get('origin');
  if (headerOrigin) return headerOrigin;
  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

/**
 * Validate that the request comes from the same origin we expect.
 * Helps mitigate CSRF for cookie-based admin actions.
 */
export function ensureSameOrigin(request: NextRequest): NextResponse | null {
  const requestOrigin = getOriginFromRequest(request);
  const expectedOrigin = appOrigin ?? request.nextUrl.origin;

  if (!requestOrigin || requestOrigin !== expectedOrigin) {
    return NextResponse.json(
      { error: 'Invalid request origin' },
      { status: 403 }
    );
  }

  return null;
}

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
export function requireAuth(
  request: NextRequest,
  options: { requireSameOrigin?: boolean } = {}
): NextResponse | null {
  const { requireSameOrigin = true } = options;

  if (requireSameOrigin) {
    const originError = ensureSameOrigin(request);
    if (originError) return originError;
  }

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
 * Non-throwing helper to know if a request is authenticated
 */
export function isRequestAuthenticated(request: NextRequest): boolean {
  const token = getAuthTokenFromRequest(request);
  const payload = token ? verifyAuthToken(token) : null;
  return !!payload?.authenticated;
}

/**
 * Sets the auth token as a secure httpOnly cookie
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set('admin_auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
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
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
}

