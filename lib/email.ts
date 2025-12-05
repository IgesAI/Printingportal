import * as nodemailer from 'nodemailer';

// Validate SMTP configuration
function getTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // Check if SMTP is configured
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error(
      'SMTP configuration is missing. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.'
    );
  }

  // Prevent localhost connections in production
  if (smtpHost === 'localhost' || smtpHost === '127.0.0.1') {
    throw new Error(
      'Cannot use localhost SMTP server in production. Please configure an external SMTP service (e.g., Gmail, SendGrid, Mailgun, AWS SES).'
    );
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort || '587'),
    secure: smtpPort === '465', // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export interface EmailRequestData {
  id: string;
  partNumber: string;
  description?: string;
  quantity: number;
  deadline?: Date;
  requesterName: string;
  requesterEmail: string;
  status: string;
  fileName?: string;
  workOrderType?: 'aero' | 'moto' | null;
}

export async function sendRequestConfirmation(requestData: EmailRequestData): Promise<void> {
  try {
    const transporter = getTransporter();
    const subject = `3D Print Request Confirmation - ${requestData.partNumber}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">3D Print Request Confirmation</h2>
        <p>Hi ${requestData.requesterName},</p>
        <p>Your 3D print request has been successfully submitted. Here are the details:</p>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Request Details:</h3>
          <p><strong>Part Number:</strong> ${requestData.partNumber}</p>
          <p><strong>Quantity:</strong> ${requestData.quantity}</p>
          ${requestData.description ? `<p><strong>Description:</strong> ${requestData.description}</p>` : ''}
          ${requestData.deadline ? `<p><strong>Deadline:</strong> ${new Date(requestData.deadline).toLocaleDateString()}</p>` : ''}
          ${requestData.fileName ? `<p><strong>File:</strong> ${requestData.fileName}</p>` : ''}
          <p><strong>Status:</strong> ${requestData.status}</p>
        </div>

        <p>You can track the progress of your request at: <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/${requestData.id}">View Request</a></p>

        <p>Thank you for using our 3D printing service!</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: requestData.requesterEmail,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send request confirmation email:', error);
    throw error;
  }
}

export async function sendStatusUpdate(requestData: EmailRequestData, oldStatus: string): Promise<void> {
  try {
    const transporter = getTransporter();
    const subject = `3D Print Request Status Update - ${requestData.partNumber}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">3D Print Request Status Update</h2>
        <p>Hi ${requestData.requesterName},</p>
        <p>The status of your 3D print request has been updated:</p>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Request Details:</h3>
          <p><strong>Part Number:</strong> ${requestData.partNumber}</p>
          <p><strong>Quantity:</strong> ${requestData.quantity}</p>
          ${requestData.description ? `<p><strong>Description:</strong> ${requestData.description}</p>` : ''}
          <p><strong>Previous Status:</strong> ${oldStatus}</p>
          <p><strong>New Status:</strong> ${requestData.status}</p>
          ${requestData.deadline ? `<p><strong>Deadline:</strong> ${new Date(requestData.deadline).toLocaleDateString()}</p>` : ''}
        </div>

        <p>You can track the progress of your request at: <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests/${requestData.id}">View Request</a></p>

        <p>Best regards,<br>3D Print Team</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: requestData.requesterEmail,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send status update email:', error);
    throw error;
  }
}

export async function sendBuilderNotification(requestData: EmailRequestData, isNewRequest: boolean = true): Promise<void> {
  try {
    const transporter = getTransporter();
    const subject = isNewRequest 
      ? `New 3D Print Request - ${requestData.partNumber}`
      : `3D Print Request Status Update - ${requestData.partNumber}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${isNewRequest ? 'New 3D Print Request' : '3D Print Request Status Update'}</h2>
        <p>${isNewRequest ? 'A new 3D print request has been submitted.' : 'The status of a 3D print request has been updated.'}</p>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Request Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 140px;">Part Number:</td>
              <td style="padding: 8px 0;">${requestData.partNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Quantity:</td>
              <td style="padding: 8px 0;">${requestData.quantity}</td>
            </tr>
            ${requestData.description ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Description:</td>
              <td style="padding: 8px 0;">${requestData.description}</td>
            </tr>
            ` : ''}
            ${requestData.deadline ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Deadline:</td>
              <td style="padding: 8px 0;">${new Date(requestData.deadline).toLocaleDateString()}</td>
            </tr>
            ` : ''}
            ${requestData.fileName ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">File Attached:</td>
              <td style="padding: 8px 0;">${requestData.fileName}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Status:</td>
              <td style="padding: 8px 0;">${requestData.status}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin-top: 0;">Requester Information:</h4>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${requestData.requesterName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${requestData.requesterEmail}</p>
        </div>

        <p style="margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/request/${requestData.id}" 
             style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Request Details
          </a>
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message from the 3D Print Request Portal.</p>
      </div>
    `;

    // Send to builder (nateg@cobramotorcycle.com)
    const builderEmail = process.env.BUILDER_EMAIL || 'nateg@cobramotorcycle.com';

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: builderEmail,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send builder notification email:', error);
    throw error;
  }
}

export async function sendWorkOrderRequest(requestData: EmailRequestData): Promise<void> {
  try {
    const transporter = getTransporter();
    const workOrderType = requestData.workOrderType || 'aero'; // Default to aero if not specified
    const isAero = workOrderType === 'aero';
    const recipientName = isAero ? 'Mike' : 'Gunner';
    const recipientEmail = isAero ? 'miker@cobra-aero.com' : 'gunnarf@cobramotorcycle.com';
    const subject = `Work Order Request - ${isAero ? 'Aero' : 'Moto'} - Part #${requestData.partNumber}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Work Order Request - ${isAero ? 'Aero' : 'Moto'}</h2>
        <p>A new ${isAero ? 'Aero' : 'Moto'} work order has been requested through the 3D Print Portal.</p>

        <div style="background-color: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <h3 style="margin-top: 0;">Request Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 140px;">Part Number:</td>
              <td style="padding: 8px 0;">${requestData.partNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Type:</td>
              <td style="padding: 8px 0;">${isAero ? 'Aero' : 'Moto'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Quantity Needed:</td>
              <td style="padding: 8px 0;">${requestData.quantity}</td>
            </tr>
            ${requestData.description ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Description:</td>
              <td style="padding: 8px 0;">${requestData.description}</td>
            </tr>
            ` : ''}
            ${requestData.deadline ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Deadline:</td>
              <td style="padding: 8px 0;">${new Date(requestData.deadline).toLocaleDateString()}</td>
            </tr>
            ` : ''}
            ${requestData.fileName ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">File Attached:</td>
              <td style="padding: 8px 0;">${requestData.fileName}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin-top: 0;">Requester Information:</h4>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${requestData.requesterName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${requestData.requesterEmail}</p>
        </div>

        <p>Please create a work order for this ${isAero ? 'Aero' : 'Moto'} request.</p>
        
        <p style="margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/request/${requestData.id}" 
             style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Request Details
          </a>
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message from the 3D Print Request Portal.</p>
      </div>
    `;

    // Send to the appropriate recipient based on workOrderType
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipientEmail,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send work order request email:', error);
    throw error;
  }
}

export async function testEmailConnection(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email connection test failed:', error);
    return false;
  }
}
