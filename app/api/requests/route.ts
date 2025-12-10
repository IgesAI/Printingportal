import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendRequestConfirmation, sendWorkOrderRequest, sendBuilderNotification } from '@/lib/email';
import { Prisma } from '@prisma/client';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { isRequestAuthenticated } from '@/lib/auth-server';

export const runtime = 'nodejs';

const parsedUploadLimit = Number(process.env.MAX_UPLOAD_MB);
const MAX_UPLOAD_BYTES =
  (Number.isFinite(parsedUploadLimit) && parsedUploadLimit > 0
    ? parsedUploadLimit
    : 200) *
  1024 *
  1024;

export async function POST(request: NextRequest) {
  try {
    const rate = checkRateLimit(`create:${getClientIdentifier(request)}`, 20, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      );
    }

    const validateEmail = (email: string) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const cleanText = (value: string | null, max = 500) => {
      if (!value) return null;
      return value.replace(/\s+/g, ' ').trim().slice(0, max);
    };

    const formData = await request.formData();

    // Extract basic fields
    const partNumberRaw = formData.get('partNumber') as string;
    const descriptionRaw = formData.get('description') as string;
    const quantity = parseInt(formData.get('quantity') as string);
    const deadlineRaw = formData.get('deadline') as string;
    const requesterNameRaw = formData.get('requesterName') as string;
    const requesterEmailRaw = formData.get('requesterEmail') as string;
    const requestType = (formData.get('requestType') as string) || 'rd_parts';
    const workOrderType = formData.get('workOrderType') as string | null;
    const fileUrl = formData.get('fileUrl') as string | null;
    const fileNameField = formData.get('fileName') as string | null;
    const fileSizeField = formData.get('fileSize') as string | null;

    const partNumber = cleanText(partNumberRaw, 120);
    const description = cleanText(descriptionRaw, 2000);
    const requesterName = cleanText(requesterNameRaw, 120);
    const requesterEmail = requesterEmailRaw?.trim();
    const deadline = deadlineRaw?.trim();
    const deadlineDate = deadline ? new Date(deadline) : null;
    if (deadline && Number.isNaN(deadlineDate?.getTime?.())) {
      return NextResponse.json({ error: 'Invalid deadline date' }, { status: 400 });
    }

    // Validate required fields
    if (!partNumber || !quantity || !requesterName || !requesterEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!validateEmail(requesterEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (quantity < 1 || quantity > 100000) {
      return NextResponse.json({ error: 'Quantity must be between 1 and 100000' }, { status: 400 });
    }

    // Validate workOrderType is provided when requestType is work_order
    if (requestType === 'work_order' && !workOrderType) {
      return NextResponse.json(
        { error: 'Work order type (aero or moto) is required for work order requests' },
        { status: 400 }
      );
    }

    // Handle optional uploaded metadata (from Vercel Blob presign flow)
    let uploadMeta:
      | { fileName: string; filePath: string; fileSize: number }
      | null = null;

    if (fileUrl || fileNameField || fileSizeField) {
      if (!fileUrl || !fileNameField || !fileSizeField) {
        return NextResponse.json(
          { error: 'fileUrl, fileName, and fileSize must all be provided for file uploads' },
          { status: 400 }
        );
      }
      const parsedSize = Number(fileSizeField);
      if (!Number.isFinite(parsedSize)) {
        return NextResponse.json({ error: 'Invalid fileSize' }, { status: 400 });
      }
      if (parsedSize > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: `File too large. Max allowed is ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB` },
          { status: 400 }
        );
      }
      uploadMeta = {
        fileName: cleanText(fileNameField.split(/[/\\]/).pop() || fileNameField, 255) || '',
        filePath: fileUrl,
        fileSize: parsedSize,
      };
    }

    // Create the request in database
    const requestData: any = {
      partNumber,
      description: description || null,
      quantity,
      deadline: deadlineDate,
      requesterName,
      requesterEmail,
      requestType: requestType as 'rd_parts' | 'work_order',
    };

    // Only add workOrderType if it's a work_order request
    if (requestType === 'work_order' && workOrderType) {
      requestData.workOrderType = workOrderType as 'aero' | 'moto';
    }

    if (uploadMeta) {
      requestData.fileName = uploadMeta.fileName;
      requestData.filePath = uploadMeta.filePath;
      requestData.fileSize = uploadMeta.fileSize;
    }

    const newRequest = await prisma.printRequest.create({
      data: requestData,
    });

    // Send confirmation email to requester
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

    // Send notification to builder (nateg@cobramotorcycle.com) for all new requests
    try {
      await sendBuilderNotification({
        id: newRequest.id,
        partNumber: newRequest.partNumber,
        description: newRequest.description || undefined,
        quantity: newRequest.quantity,
        deadline: newRequest.deadline || undefined,
        requesterName: newRequest.requesterName,
        requesterEmail: newRequest.requesterEmail,
        status: newRequest.status,
        fileName: newRequest.fileName || undefined,
      }, true);
    } catch (builderEmailError) {
      console.error('Failed to send builder notification email:', builderEmailError);
      // Don't fail the request if email fails
    }

    // If this is a work order request, send email to the appropriate person (Mike for Aero, Gunner for Moto)
    const requestWorkOrderType = (newRequest as any).workOrderType;
    if (newRequest.requestType === 'work_order' && requestWorkOrderType) {
      try {
        await sendWorkOrderRequest({
          id: newRequest.id,
          partNumber: newRequest.partNumber,
          description: newRequest.description || undefined,
          quantity: newRequest.quantity,
          deadline: newRequest.deadline || undefined,
          requesterName: newRequest.requesterName,
          requesterEmail: newRequest.requesterEmail,
          status: newRequest.status,
          fileName: newRequest.fileName || undefined,
          workOrderType: requestWorkOrderType as 'aero' | 'moto',
        });
      } catch (workOrderEmailError) {
        console.error('Failed to send work order request email:', workOrderEmailError);
        // Don't fail the request if email fails
      }
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
    const isAuthed = isRequestAuthenticated(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const requesterEmail = searchParams.get('requesterEmail');
    const search = searchParams.get('search');
    const requestType = searchParams.get('requestType');
    const sortColumn = searchParams.get('sortColumn');
    const sortDirection = searchParams.get('sortDirection');

    const where: Prisma.PrintRequestWhereInput = {};

    if (status) {
      where.status = status as any;
    }

    if (requesterEmail) {
      where.requesterEmail = requesterEmail;
    }

    if (requestType) {
      where.requestType = requestType as any;
    }

    if (search) {
      where.OR = [
        { partNumber: { contains: search, mode: 'insensitive' } },
        { requesterName: { contains: search, mode: 'insensitive' } },
        { requesterEmail: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sortColumn && sortDirection) {
      orderBy[sortColumn] = sortDirection;
    } else {
      orderBy.createdAt = 'desc';
    }

    const requests = await prisma.printRequest.findMany({
      where,
      orderBy,
    });

    const sanitized = isAuthed
      ? requests
      : requests.map((req) => ({
          ...req,
          requesterEmail: undefined,
          notes: undefined,
          filePath: undefined,
        }));

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error('Error fetching requests:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error('Error details:', errorDetails);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
