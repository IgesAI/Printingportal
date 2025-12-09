import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-server';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  // Require authentication
  const authError = requireAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const { id } = await context.params;

    const requestData = await prisma.printRequest.findUnique({
      where: { id },
    });

    if (!requestData || !requestData.filePath || !requestData.fileName) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const targetUrl = requestData.filePath.startsWith('http')
      ? requestData.filePath
      : requestData.filePath;

    return NextResponse.redirect(targetUrl);
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

