import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-server';
import { createPresignedUrl } from '@vercel/blob';

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

    const isFullUrl = requestData.filePath.startsWith('http');
    const blobPath = isFullUrl ? new URL(requestData.filePath).pathname : requestData.filePath;

    const { url: signedUrl } = await createPresignedUrl({
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      pathname: blobPath,
      expiresIn: 60 * 5,
      mode: 'read',
    });

    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

