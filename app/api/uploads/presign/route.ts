import { NextRequest, NextResponse } from 'next/server';
import { createPresignedUrl } from '@vercel/blob';
import crypto from 'crypto';

export const runtime = 'nodejs';

const ALLOWED = new Set([
  '.stl',
  '.step',
  '.stp',
  '.sldprt',
  '.sldasm',
  '.3mf',
  '.obj',
  '.iges',
  '.igs',
]);

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileSize } = await req.json();

    if (!fileName || !fileSize) {
      return NextResponse.json({ error: 'fileName and fileSize required' }, { status: 400 });
    }

    const ext = `.${fileName.split('.').pop()?.toLowerCase() || ''}`;
    if (!ALLOWED.has(ext)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const maxBytes = (Number(process.env.MAX_UPLOAD_MB || 200) || 200) * 1024 * 1024;
    if (fileSize > maxBytes) {
      return NextResponse.json(
        { error: `File too large. Max ${Math.floor(maxBytes / 1024 / 1024)} MB` },
        { status: 400 }
      );
    }

    const { url: uploadUrl, pathname } = await createPresignedUrl({
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      pathname: `uploads/${Date.now()}-${crypto.randomUUID()}-${fileName}`,
      expiresIn: 60 * 10,
      contentType: 'application/octet-stream',
      mode: 'upload',
    });

    return NextResponse.json({ uploadUrl, blobPath: pathname });
  } catch (err) {
    console.error('presign error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

