import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendDueDateReminder } from '@/lib/email';

// GET /api/reminders - Check and send due date reminders
// This endpoint can be called by a cron job (e.g., Vercel Cron, GitHub Actions)
// or manually from the dashboard
export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // If CRON_SECRET is set, require it for automated calls
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow manual calls without auth (you can add dashboard auth later)
      const isManualCall = request.headers.get('x-manual-trigger') === 'true';
      if (!isManualCall) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find all requests with reminders enabled that haven't been completed/canceled
    const requestsWithReminders = await prisma.printRequest.findMany({
      where: {
        reminderEnabled: true,
        status: {
          notIn: ['Completed', 'Canceled'],
        },
      },
      include: {
        requester: true,
      },
    });

    const results = {
      checked: requestsWithReminders.length,
      sent: 0,
      skipped: 0,
      errors: 0,
      details: [] as { id: string; partNumber: string; action: string }[],
    };

    for (const req of requestsWithReminders) {
      const dueDate = new Date(req.requiredDate);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - (req.reminderDaysBefore || 1));
      
      // Set to start of day for comparison
      const reminderDay = new Date(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());
      
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Check if we should send reminder today
      if (today >= reminderDay && daysUntilDue >= 0) {
        // Check if we already sent a reminder today
        const lastReminder = req.lastReminderSent;
        if (lastReminder) {
          const lastReminderDay = new Date(lastReminder.getFullYear(), lastReminder.getMonth(), lastReminder.getDate());
          if (lastReminderDay.getTime() === today.getTime()) {
            results.skipped++;
            results.details.push({ id: req.id, partNumber: req.partNumber, action: 'already_sent_today' });
            continue;
          }
        }

        // Send reminder
        const sent = await sendDueDateReminder(
          {
            id: req.id,
            partNumber: req.partNumber,
            quantity: req.quantity,
            requiredDate: req.requiredDate,
            priority: req.priority,
            fileReference: req.fileReference,
            description: req.description,
            status: req.status,
            requesterName: req.requester.name,
            requesterEmail: req.requester.email,
          },
          daysUntilDue
        );

        if (sent) {
          // Update last reminder sent timestamp
          await prisma.printRequest.update({
            where: { id: req.id },
            data: { lastReminderSent: now },
          });
          results.sent++;
          results.details.push({ id: req.id, partNumber: req.partNumber, action: 'sent' });
        } else {
          results.errors++;
          results.details.push({ id: req.id, partNumber: req.partNumber, action: 'email_not_configured' });
        }
      } else {
        results.skipped++;
        results.details.push({ id: req.id, partNumber: req.partNumber, action: 'not_due_yet' });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${results.checked} requests, sent ${results.sent} reminders`,
      results,
    });
  } catch (error) {
    console.error('Error processing reminders:', error);
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}

// POST /api/reminders - Manually trigger a reminder for a specific request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    const req = await prisma.printRequest.findUnique({
      where: { id: requestId },
      include: { requester: true },
    });

    if (!req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const dueDate = new Date(req.requiredDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const sent = await sendDueDateReminder(
      {
        id: req.id,
        partNumber: req.partNumber,
        quantity: req.quantity,
        requiredDate: req.requiredDate,
        priority: req.priority,
        fileReference: req.fileReference,
        description: req.description,
        status: req.status,
        requesterName: req.requester.name,
        requesterEmail: req.requester.email,
      },
      Math.max(0, daysUntilDue)
    );

    if (sent) {
      await prisma.printRequest.update({
        where: { id: requestId },
        data: { lastReminderSent: new Date() },
      });
      return NextResponse.json({ success: true, message: 'Reminder sent' });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Email not configured - check SMTP settings' 
      });
    }
  } catch (error) {
    console.error('Error sending manual reminder:', error);
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    );
  }
}

