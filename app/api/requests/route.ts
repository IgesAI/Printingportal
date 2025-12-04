import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendRequestConfirmation, sendWorkOrderRequest } from '@/lib/email';
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
    const requestType = (formData.get('requestType') as string) || 'rd_parts';

    // Validate required fields
    if (!partNumber || !quantity || !requesterName || !requesterEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the request in database
    const requestData = {
      partNumber,
      description: description || null,
      quantity,
      deadline: deadline ? new Date(deadline) : null,
      requesterName,
      requesterEmail,
      requestType: requestType as 'rd_parts' | 'work_order',
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

    // If this is a work order request, send email to Mike and Gunner
    if (newRequest.requestType === 'work_order') {
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
