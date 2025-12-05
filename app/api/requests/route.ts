import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendRequestConfirmation, sendWorkOrderRequest, sendBuilderNotification } from '@/lib/email';
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
    const workOrderType = formData.get('workOrderType') as string | null;

    // Validate required fields
    if (!partNumber || !quantity || !requesterName || !requesterEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate workOrderType is provided when requestType is work_order
    if (requestType === 'work_order' && !workOrderType) {
      return NextResponse.json(
        { error: 'Work order type (aero or moto) is required for work order requests' },
        { status: 400 }
      );
    }

    // Create the request in database
    const requestData: any = {
      partNumber,
      description: description || null,
      quantity,
      deadline: deadline ? new Date(deadline) : null,
      requesterName,
      requesterEmail,
      requestType: requestType as 'rd_parts' | 'work_order',
    };

    // Only add workOrderType if it's a work_order request
    if (requestType === 'work_order' && workOrderType) {
      requestData.workOrderType = workOrderType as 'aero' | 'moto';
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
    if (newRequest.requestType === 'work_order' && newRequest.workOrderType) {
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
          workOrderType: newRequest.workOrderType,
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

    return NextResponse.json(requests);
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
