import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendNewRequestNotification, sendRequestConfirmation } from '@/lib/email';
import { Prisma } from '@prisma/client';

// GET /api/requests - List all requests with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const requesterId = searchParams.get('requesterId');
    const dueSoon = searchParams.get('dueSoon'); // "true" to filter due within 7 days

    const where: Prisma.PrintRequestWhereInput = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (requesterId) {
      where.requesterId = requesterId;
    }

    if (dueSoon === 'true') {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      where.requiredDate = {
        lte: weekFromNow,
      };
      // Only show non-completed/canceled
      where.status = {
        notIn: ['Completed', 'Canceled'],
      };
    }

    const requests = await prisma.printRequest.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { requiredDate: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

// POST /api/requests - Create a new request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      partNumber,
      quantity,
      requiredDate,
      priority,
      fileReference,
      description,
      requesterEmail,
      requesterName,
    } = body;

    // Validate required fields
    if (!partNumber || !quantity || !requiredDate || !requesterEmail || !requesterName) {
      return NextResponse.json(
        { error: 'Missing required fields: partNumber, quantity, requiredDate, requesterEmail, requesterName' },
        { status: 400 }
      );
    }

    // Find or create the user
    let user = await prisma.user.findUnique({
      where: { email: requesterEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: requesterEmail,
          name: requesterName,
          role: 'requester',
        },
      });
    }

    // Create the request
    const newRequest = await prisma.printRequest.create({
      data: {
        requesterId: user.id,
        partNumber,
        quantity: parseInt(quantity),
        requiredDate: new Date(requiredDate),
        priority: priority || 'Normal',
        fileReference: fileReference || null,
        description: description || null,
        status: 'New',
      },
      include: {
        requester: true,
      },
    });

    // Create initial status history entry
    await prisma.statusHistory.create({
      data: {
        requestId: newRequest.id,
        oldStatus: 'New',
        newStatus: 'New',
        changedById: user.id,
        comment: 'Request created',
      },
    });

    // Send email notifications
    const emailData = {
      id: newRequest.id,
      partNumber: newRequest.partNumber,
      quantity: newRequest.quantity,
      requiredDate: newRequest.requiredDate,
      priority: newRequest.priority,
      fileReference: newRequest.fileReference,
      description: newRequest.description,
      status: newRequest.status,
      requesterName: user.name,
      requesterEmail: user.email,
    };

    // Send to operator
    await sendNewRequestNotification(emailData);
    
    // Send confirmation to requester
    await sendRequestConfirmation(emailData);

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    );
  }
}
