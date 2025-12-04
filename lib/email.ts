import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
}

export async function sendRequestConfirmation(requestData: EmailRequestData): Promise<void> {
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
    from: process.env.SMTP_FROM,
    to: requestData.requesterEmail,
    subject,
    html,
  });
}

export async function sendStatusUpdate(requestData: EmailRequestData, oldStatus: string): Promise<void> {
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
    from: process.env.SMTP_FROM,
    to: requestData.requesterEmail,
    subject,
    html,
  });
}

export async function sendWorkOrderRequest(requestData: EmailRequestData): Promise<void> {
  const subject = `Work Order Request - Part #${requestData.partNumber}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">Work Order Request</h2>
      <p>A new work order has been requested through the 3D Print Portal.</p>

      <div style="background-color: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
        <h3 style="margin-top: 0;">Request Details:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 140px;">Part Number:</td>
            <td style="padding: 8px 0;">${requestData.partNumber}</td>
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

      <p>Please create a work order for this request.</p>
      
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

  // Send to both Mike and Gunner
  const recipients = ['miker@cobra-aero.com', 'gunnarf@cobramotorcycle.com'];

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: recipients.join(', '),
    subject,
    html,
  });
}

export async function testEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email connection test failed:', error);
    return false;
  }
}
