import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  clearAuthCookie(response);
  return response;
}

