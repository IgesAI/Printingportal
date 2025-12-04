import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
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

export async function testEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email connection test failed:', error);
    return false;
  }
}
