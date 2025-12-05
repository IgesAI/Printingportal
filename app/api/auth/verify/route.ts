import { NextRequest, NextResponse } from 'next/server';
import { getAuthTokenFromRequest, verifyAuthToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const token = getAuthTokenFromRequest(request);
  
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = verifyAuthToken(token);
  
  if (!payload || !payload.authenticated) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true });
}

