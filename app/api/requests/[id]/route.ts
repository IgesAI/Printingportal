import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendStatusChangeNotification } from '@/lib/email';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/requests/[id] - Get single request with history
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const requestData = await prisma.printRequest.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        statusHistory: {
          include: {
            changedBy: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            changedAt: 'desc',
          },
        },
      },
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
      { error: 'Failed to fetch request' },
      { status: 500 }
    );
  }
}

// PATCH /api/requests/[id] - Update request (status, notes, etc.)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      status,
      operatorNotes,
      quantity,
      requiredDate,
      priority,
      comment,
      operatorId, // ID of the operator making the change
    } = body;

    // Get current request
    const currentRequest = await prisma.printRequest.findUnique({
      where: { id },
      include: {
        requester: true,
      },
    });

    if (!currentRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    const oldStatus = currentRequest.status;

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (operatorNotes !== undefined) updateData.operatorNotes = operatorNotes;
    if (quantity) updateData.quantity = parseInt(quantity);
    if (requiredDate) updateData.requiredDate = new Date(requiredDate);
    if (priority) updateData.priority = priority;

    // Update the request
    const updatedRequest = await prisma.printRequest.update({
      where: { id },
      data: updateData,
      include: {
        requester: true,
      },
    });

    // If status changed, create history entry and send notification
    if (status && status !== oldStatus) {
      // Get operator for history (default to requester if not provided)
      const changedById = operatorId || currentRequest.requesterId;

      await prisma.statusHistory.create({
        data: {
          requestId: id,
          oldStatus,
          newStatus: status,
          changedById,
          comment: comment || null,
        },
      });

      // Send email notification to requester
      await sendStatusChangeNotification(
        {
          id: updatedRequest.id,
          partNumber: updatedRequest.partNumber,
          quantity: updatedRequest.quantity,
          requiredDate: updatedRequest.requiredDate,
          priority: updatedRequest.priority,
          fileReference: updatedRequest.fileReference,
          description: updatedRequest.description,
          status: updatedRequest.status,
          requesterName: updatedRequest.requester.name,
          requesterEmail: updatedRequest.requester.email,
        },
        oldStatus,
        comment
      );
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating request:', error);
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    );
  }
}

// DELETE /api/requests/[id] - Delete a request
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if request exists
    const existingRequest = await prisma.printRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Delete the request (cascade will delete status history)
    await prisma.printRequest.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting request:', error);
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    );
  }
}
