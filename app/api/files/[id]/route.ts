import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const requestData = await prisma.printRequest.findUnique({
      where: { id },
    });

    if (!requestData || !requestData.filePath || !requestData.fileName) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if file exists
    try {
      await fs.access(requestData.filePath);
    } catch {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    }

    // Read file
    const fileBuffer = await fs.readFile(requestData.filePath);
    const fileExtension = path.extname(requestData.fileName).toLowerCase();

    // Determine content type
    const contentTypes: Record<string, string> = {
      '.stl': 'application/octet-stream',
      '.obj': 'application/octet-stream',
      '.step': 'application/octet-stream',
      '.stp': 'application/octet-stream',
      '.iges': 'application/octet-stream',
      '.igs': 'application/octet-stream',
      '.3ds': 'application/octet-stream',
      '.dae': 'application/xml',
      '.fbx': 'application/octet-stream',
      '.ply': 'application/octet-stream',
      '.x3d': 'application/xml',
      '.gltf': 'application/json',
      '.glb': 'model/gltf-binary',
    };

    const contentType = contentTypes[fileExtension] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${requestData.fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

