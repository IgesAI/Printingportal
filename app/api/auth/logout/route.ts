import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, ensureSameOrigin } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const originError = ensureSameOrigin(request);
  if (originError) return originError;

  const response = NextResponse.json({ success: true });
  clearAuthCookie(response);
  return response;
}

