import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { saveUploadedFile, validateFile } from '@/lib/fileStorage';
import { sendRequestConfirmation } from '@/lib/email';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract basic fields
    const partNumber = formData.get('partNumber') as string;
    const description = formData.get('description') as string;
    const quantity = parseInt(formData.get('quantity') as string);
    const deadline = formData.get('deadline') as string;
    const requesterName = formData.get('requesterName') as string;
    const requesterEmail = formData.get('requesterEmail') as string;

    // Validate required fields
    if (!partNumber || !quantity || !requesterName || !requesterEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Handle file upload if present
    let fileInfo = null;
    const file = formData.get('file') as File;

    if (file && file.size > 0) {
      // Convert File to Express.Multer.File format for validation
      const multerFile = {
        fieldname: 'file',
        originalname: file.name,
        encoding: '7bit',
        mimetype: file.type,
        buffer: Buffer.from(await file.arrayBuffer()),
        size: file.size,
        path: '', // Will be set by multer if needed
        stream: null,
        destination: '',
        filename: '',
      };

      const validation = validateFile(multerFile);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      // Save file temporarily for processing
      const tempPath = `/tmp/${Date.now()}-${file.name}`;
      await require('fs').promises.writeFile(tempPath, multerFile.buffer);
      multerFile.path = tempPath;

      fileInfo = await saveUploadedFile(multerFile);
    }

    // Create the request in database
    const requestData = {
      partNumber,
      description: description || null,
      quantity,
      deadline: deadline ? new Date(deadline) : null,
      requesterName,
      requesterEmail,
      ...(fileInfo && {
        fileName: fileInfo.originalName,
        filePath: fileInfo.path,
        fileSize: fileInfo.size,
      }),
    };

    const newRequest = await prisma.printRequest.create({
      data: requestData,
    });

    // Send confirmation email
    try {
      await sendRequestConfirmation({
        id: newRequest.id,
        partNumber: newRequest.partNumber,
        description: newRequest.description || undefined,
        quantity: newRequest.quantity,
        deadline: newRequest.deadline || undefined,
        requesterName: newRequest.requesterName,
        requesterEmail: newRequest.requesterEmail,
        status: newRequest.status,
        fileName: newRequest.fileName || undefined,
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const requesterEmail = searchParams.get('requesterEmail');

    const where: Prisma.PrintRequestWhereInput = {};

    if (status) {
      where.status = status as any;
    }

    if (requesterEmail) {
      where.requesterEmail = requesterEmail;
    }

    const requests = await prisma.printRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
