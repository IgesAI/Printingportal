import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendStatusUpdate, sendBuilderNotification } from '@/lib/email';
import { requireAuth } from '@/lib/auth-server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const requestData = await prisma.printRequest.findUnique({
      where: { id },
    });

    if (!requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(requestData);
  } catch (error) {
    console.error('Error fetching request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  // Require authentication
  const authError = requireAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const { status, notes } = body;

    // Get current request to check if status changed
    const currentRequest = await prisma.printRequest.findUnique({
      where: { id },
    });

    if (!currentRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    const oldStatus = currentRequest.status;

    // Update the request
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updatedRequest = await prisma.printRequest.update({
      where: { id },
      data: updateData,
    });

    // Send status update email if status changed
    if (status && status !== oldStatus) {
      // Send to requester
      try {
        await sendStatusUpdate({
          id: updatedRequest.id,
          partNumber: updatedRequest.partNumber,
          description: updatedRequest.description || undefined,
          quantity: updatedRequest.quantity,
          deadline: updatedRequest.deadline || undefined,
          requesterName: updatedRequest.requesterName,
          requesterEmail: updatedRequest.requesterEmail,
          status: updatedRequest.status,
          fileName: updatedRequest.fileName || undefined,
        }, oldStatus);
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
        // Don't fail the update if email fails
      }

      // Send to builder (nateg@cobramotorcycle.com)
      try {
        await sendBuilderNotification({
          id: updatedRequest.id,
          partNumber: updatedRequest.partNumber,
          description: updatedRequest.description || undefined,
          quantity: updatedRequest.quantity,
          deadline: updatedRequest.deadline || undefined,
          requesterName: updatedRequest.requesterName,
          requesterEmail: updatedRequest.requesterEmail,
          status: updatedRequest.status,
          fileName: updatedRequest.fileName || undefined,
        }, false);
      } catch (builderEmailError) {
        console.error('Failed to send builder status update email:', builderEmailError);
        // Don't fail the update if email fails
      }
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  // Require authentication
  const authError = requireAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const { id } = await context.params;

    // Get request to check if file exists
    const requestData = await prisma.printRequest.findUnique({
      where: { id },
    });

    if (!requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Delete associated file if it exists
    if (requestData.filePath) {
      try {
        const fs = require('fs').promises;
        await fs.unlink(requestData.filePath);
      } catch (fileError) {
        console.warn('Failed to delete file:', fileError);
      }
    }

    // Delete the request
    await prisma.printRequest.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
