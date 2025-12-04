import nodemailer from 'nodemailer';

// Check if email is configured
const isEmailConfigured = () => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM
  );
};

// Only create transporter if email is configured
const transporter = isEmailConfigured()
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

// Get operator email from env or default
const OPERATOR_EMAIL = process.env.OPERATOR_EMAIL || process.env.SMTP_USER || '';

export interface RequestEmailData {
  id: string;
  partNumber: string;
  quantity: number;
  requiredDate: Date;
  priority: string;
  fileReference?: string | null;
  description?: string | null;
  status: string;
  requesterName: string;
  requesterEmail: string;
}

// Email sent to operator when a new request is created
export async function sendNewRequestNotification(data: RequestEmailData): Promise<void> {
  if (!isEmailConfigured() || !transporter) {
    console.log('📧 [New Request] Would notify operator:', OPERATOR_EMAIL);
    console.log('Request:', { id: data.id, partNumber: data.partNumber, quantity: data.quantity });
    return;
  }

  const subject = `New 3D Print Request: ${data.partNumber} (Qty ${data.quantity})`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">New 3D Print Request</h2>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 140px;">Ticket ID:</td>
            <td style="padding: 8px 0;">#${data.id.slice(-8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Requester:</td>
            <td style="padding: 8px 0;">${data.requesterName} (${data.requesterEmail})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Part Number:</td>
            <td style="padding: 8px 0;">${data.partNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Quantity:</td>
            <td style="padding: 8px 0;">${data.quantity}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Required Date:</td>
            <td style="padding: 8px 0;">${new Date(data.requiredDate).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Priority:</td>
            <td style="padding: 8px 0;">
              <span style="background: ${getPriorityColor(data.priority)}; color: white; padding: 4px 12px; border-radius: 4px;">
                ${data.priority}
              </span>
            </td>
          </tr>
          ${data.fileReference ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">File Reference:</td>
            <td style="padding: 8px 0; font-family: monospace; font-size: 13px;">${data.fileReference}</td>
          </tr>
          ` : ''}
          ${data.description ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Description:</td>
            <td style="padding: 8px 0;">${data.description}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
           style="background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View in Dashboard
        </a>
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: OPERATOR_EMAIL,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send new request notification:', error);
  }
}

// Email sent to requester confirming their submission
export async function sendRequestConfirmation(data: RequestEmailData): Promise<void> {
  if (!isEmailConfigured() || !transporter) {
    console.log('📧 [Confirmation] Would send to:', data.requesterEmail);
    return;
  }

  const ticketId = data.id.slice(-8).toUpperCase();
  const subject = `3D Print Request Received - Ticket #${ticketId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Request Received</h2>
      
      <p>Hi ${data.requesterName},</p>
      <p>We received your 3D print request. Here are the details:</p>

      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Ticket ID:</strong> #${ticketId}</p>
        <p><strong>Part Number:</strong> ${data.partNumber}</p>
        <p><strong>Quantity:</strong> ${data.quantity}</p>
        <p><strong>Required Date:</strong> ${new Date(data.requiredDate).toLocaleDateString()}</p>
        <p><strong>Priority:</strong> ${data.priority}</p>
        <p><strong>Status:</strong> ${data.status}</p>
      </div>

      <p>You can check the status of your request anytime:</p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/request/${data.id}" 
           style="background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View Request Status
        </a>
      </p>

      <p style="color: #666; font-size: 14px;">You'll receive email updates when the status changes.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: data.requesterEmail,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
  }
}

// Email sent to requester when status changes
export async function sendStatusChangeNotification(
  data: RequestEmailData,
  oldStatus: string,
  comment?: string
): Promise<void> {
  if (!isEmailConfigured() || !transporter) {
    console.log('📧 [Status Change] Would notify:', data.requesterEmail);
    console.log('Status:', oldStatus, '→', data.status);
    return;
  }

  const ticketId = data.id.slice(-8).toUpperCase();
  const subject = `3D Print Request #${ticketId} is now ${formatStatus(data.status)}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Status Update</h2>
      
      <p>Hi ${data.requesterName},</p>
      <p>Your 3D print request status has been updated:</p>

      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Ticket ID:</strong> #${ticketId}</p>
        <p><strong>Part Number:</strong> ${data.partNumber}</p>
        <p><strong>Quantity:</strong> ${data.quantity}</p>
        <p>
          <strong>Status:</strong> 
          <span style="text-decoration: line-through; color: #999;">${formatStatus(oldStatus)}</span>
          →
          <span style="background: ${getStatusColor(data.status)}; color: white; padding: 4px 12px; border-radius: 4px;">
            ${formatStatus(data.status)}
          </span>
        </p>
        ${comment ? `<p><strong>Note:</strong> ${comment}</p>` : ''}
      </div>

      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/request/${data.id}" 
           style="background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View Request
        </a>
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: data.requesterEmail,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send status change email:', error);
  }
}

// Helper functions
function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    Low: '#4caf50',
    Normal: '#2196f3',
    High: '#ff9800',
    Critical: '#f44336',
  };
  return colors[priority] || '#9e9e9e';
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    New: '#2196f3',
    InProgress: '#ff9800',
    OnPrinter: '#9c27b0',
    Completed: '#4caf50',
    OnHold: '#607d8b',
    Canceled: '#f44336',
  };
  return colors[status] || '#9e9e9e';
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    New: 'New',
    InProgress: 'In Progress',
    OnPrinter: 'On Printer',
    Completed: 'Completed',
    OnHold: 'On Hold',
    Canceled: 'Canceled',
  };
  return labels[status] || status;
}
