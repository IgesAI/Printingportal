import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { ensureSameOrigin } from '@/lib/auth-server';

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
    const originError = ensureSameOrigin(req);
    if (originError) return originError;

    const clientId = `presign:${getClientIdentifier(req)}`;
    const rate = checkRateLimit(clientId, 20, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many upload attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return NextResponse.json(
        { error: 'Upload service not configured. Please contact an admin.' },
        { status: 500 }
      );
    }

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

    const pathname = `uploads/${Date.now()}-${crypto.randomUUID()}-${fileName}`;

    const clientToken = await generateClientTokenFromReadWriteToken({
      token: blobToken,
      pathname,
      maximumSizeInBytes: maxBytes,
      allowedContentTypes: ['application/octet-stream', 'application/zip', 'model/step', 'model/stl', 'application/vnd.ms-pki.stl'],
      addRandomSuffix: false,
    });

    return NextResponse.json({ pathname, token: clientToken });
  } catch (err) {
    console.error('presign error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

