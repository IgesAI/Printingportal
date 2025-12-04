import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// GET /api/test-email - Test email configuration
export async function GET() {
  const config = {
    SMTP_HOST: process.env.SMTP_HOST ? '✓ Set' : '✗ Missing',
    SMTP_PORT: process.env.SMTP_PORT || '587 (default)',
    SMTP_USER: process.env.SMTP_USER ? '✓ Set' : '✗ Missing',
    SMTP_PASS: process.env.SMTP_PASS ? '✓ Set' : '✗ Missing',
    SMTP_FROM: process.env.SMTP_FROM ? '✓ Set' : '✗ Missing',
    OPERATOR_EMAIL: process.env.OPERATOR_EMAIL || process.env.SMTP_USER || '✗ Missing',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '✗ Missing',
  };

  const isConfigured = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM
  );

  if (!isConfigured) {
    return NextResponse.json({
      success: false,
      message: 'Email not configured. Missing environment variables.',
      config,
      instructions: {
        step1: 'Add SMTP settings to your .env file',
        step2: 'Add the same settings to Vercel Environment Variables',
        example: {
          SMTP_HOST: 'smtp.office365.com (for Microsoft 365) or smtp.gmail.com (for Gmail)',
          SMTP_PORT: '587',
          SMTP_USER: 'your-email@domain.com',
          SMTP_PASS: 'your-password-or-app-password',
          SMTP_FROM: 'your-email@domain.com',
          OPERATOR_EMAIL: 'nateg@cobramotorcycle.com',
        },
      },
    });
  }

  // Try to send a test email
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const operatorEmail = process.env.OPERATOR_EMAIL || process.env.SMTP_USER;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: operatorEmail,
      subject: '✅ Cobra Aero Print Portal - Email Test Successful!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1565c0;">🎉 Email Configuration Working!</h2>
          <p>Great news! Your email notifications are properly configured.</p>
          <p>You will receive:</p>
          <ul>
            <li>📬 Notifications when new print requests are submitted</li>
            <li>⏰ Reminders before due dates (when enabled)</li>
          </ul>
          <p>Requesters will receive:</p>
          <ul>
            <li>✅ Confirmation when they submit a request</li>
            <li>📊 Updates when you change the status</li>
          </ul>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            This is a test email from your Cobra Aero 3D Print Portal.
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${operatorEmail}!`,
      config,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Email configuration found but failed to send.',
      error: error instanceof Error ? error.message : 'Unknown error',
      config,
      troubleshooting: {
        tip1: 'Check if your password is correct',
        tip2: 'For Gmail, you need an App Password (not your regular password)',
        tip3: 'For Microsoft 365, you may need to enable SMTP AUTH',
        tip4: 'Make sure your email provider allows SMTP access',
      },
    });
  }
}

