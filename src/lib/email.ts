import nodemailer from "nodemailer";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@nouveauelevator.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

// Email templates
export const emailTemplates = {
  changeOrderSubmitted: (data: {
    changeOrderNumber: string;
    jobNumber: string;
    title: string;
    amount: string;
    submittedBy: string;
    link: string;
  }) => ({
    subject: `Change Order ${data.changeOrderNumber} Submitted for Review`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Change Order Submitted</h2>
        <p>A new change order has been submitted and requires your review.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Change Order #</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.changeOrderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Job #</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.jobNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Title</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Amount</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Submitted By</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.submittedBy}</td>
          </tr>
        </table>
        <a href="${data.link}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review Change Order</a>
      </div>
    `,
  }),

  changeOrderApproved: (data: {
    changeOrderNumber: string;
    jobNumber: string;
    title: string;
    approvedBy: string;
    link: string;
  }) => ({
    subject: `Change Order ${data.changeOrderNumber} Approved`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Change Order Approved</h2>
        <p>Your change order has been approved.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Change Order #</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.changeOrderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Job #</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.jobNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Title</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Approved By</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.approvedBy}</td>
          </tr>
        </table>
        <a href="${data.link}" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Change Order</a>
      </div>
    `,
  }),

  changeOrderRejected: (data: {
    changeOrderNumber: string;
    jobNumber: string;
    title: string;
    rejectedBy: string;
    reason: string;
    link: string;
  }) => ({
    subject: `Change Order ${data.changeOrderNumber} Rejected`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Change Order Rejected</h2>
        <p>Your change order has been rejected.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Change Order #</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.changeOrderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Job #</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.jobNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Title</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Rejected By</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.rejectedBy}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Reason</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.reason}</td>
          </tr>
        </table>
        <a href="${data.link}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Change Order</a>
      </div>
    `,
  }),

  jobAssigned: (data: {
    jobNumber: string;
    title: string;
    accountName: string;
    scheduledDate: string;
    address: string;
    assignedBy: string;
    link: string;
  }) => ({
    subject: `Job ${data.jobNumber} Assigned to You`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">New Job Assignment</h2>
        <p>A job has been assigned to you.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Job #</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.jobNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Title</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Account</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.accountName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Scheduled</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.scheduledDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Location</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.address}</td>
          </tr>
        </table>
        <a href="${data.link}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Job Details</a>
      </div>
    `,
  }),
};
