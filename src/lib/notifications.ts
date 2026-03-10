import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";

/**
 * Available events that admins can create triggers for.
 * Each event has a name, description, and available template variables.
 */
export const AVAILABLE_EVENTS = [
  {
    event: "ticket.created",
    label: "New Ticket Created",
    description: "Fires when a new service call/ticket is created",
    variables: ["ticketNumber", "accountName", "address", "type", "description", "createdBy"],
    defaultSubject: "New Ticket #{{ticketNumber}} - {{accountName}}",
  },
  {
    event: "ticket.statusChanged",
    label: "Ticket Status Changed",
    description: "Fires when a ticket status changes (e.g., Open → Assigned)",
    variables: ["ticketNumber", "accountName", "oldStatus", "newStatus", "changedBy"],
    defaultSubject: "Ticket #{{ticketNumber}} - Status: {{newStatus}}",
  },
  {
    event: "ticket.completed",
    label: "Ticket Completed",
    description: "Fires when a ticket is marked as completed",
    variables: ["ticketNumber", "accountName", "address", "worker", "completedDate"],
    defaultSubject: "Ticket #{{ticketNumber}} Completed - {{accountName}}",
  },
  {
    event: "ticket.highPriority",
    label: "High Priority Ticket",
    description: "Fires when a ticket is flagged as high priority",
    variables: ["ticketNumber", "accountName", "address", "type", "description"],
    defaultSubject: "HIGH PRIORITY - Ticket #{{ticketNumber}} - {{accountName}}",
  },
  {
    event: "ticket.assigned",
    label: "Ticket Assigned",
    description: "Fires when a ticket is assigned to a worker",
    variables: ["ticketNumber", "accountName", "address", "worker", "assignedBy"],
    defaultSubject: "Ticket #{{ticketNumber}} Assigned to {{worker}}",
  },
  {
    event: "job.created",
    label: "New Job Created",
    description: "Fires when a new job is created",
    variables: ["jobNumber", "title", "accountName", "address", "createdBy"],
    defaultSubject: "New Job {{jobNumber}} - {{accountName}}",
  },
  {
    event: "job.assigned",
    label: "Job Assigned",
    description: "Fires when a job is assigned to someone",
    variables: ["jobNumber", "title", "accountName", "address", "scheduledDate", "assignedBy"],
    defaultSubject: "Job {{jobNumber}} Assigned - {{accountName}}",
  },
  {
    event: "invoice.created",
    label: "Invoice Created",
    description: "Fires when a new invoice is created",
    variables: ["invoiceNumber", "accountName", "amount", "createdBy"],
    defaultSubject: "Invoice #{{invoiceNumber}} Created - {{accountName}}",
  },
];

/**
 * Generate a default HTML body template from the event's available variables.
 */
export function generateDefaultBody(event: string, label: string): string {
  const eventDef = AVAILABLE_EVENTS.find(e => e.event === event);
  const variables = eventDef?.variables || [];

  const rows = variables.map(v => {
    // Convert camelCase to Title Case for display
    const displayName = v.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
    return `<tr><td style="padding: 6px 8px; border-bottom: 1px solid #e0e0e0; font-weight: bold; width: 130px;">${displayName}</td><td style="padding: 6px 8px; border-bottom: 1px solid #e0e0e0;">{{${v}}}</td></tr>`;
  }).join("\n          ");

  return `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a5f; border-bottom: 2px solid #316ac5; padding-bottom: 8px;">${label}</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          ${rows}
        </table>
      </div>`;
}

/**
 * Replace {{variable}} placeholders in a template string with actual values.
 */
function interpolate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || "");
}

/**
 * Fire a notification event. Checks if there's an active trigger for this event,
 * and if so, sends the email and logs it.
 */
export async function fireNotification(
  event: string,
  data: Record<string, string>
): Promise<void> {
  try {
    const trigger = await prisma.emailTrigger.findUnique({
      where: { event },
    });

    if (!trigger || !trigger.isActive || !trigger.recipients.trim()) {
      return;
    }

    const recipients = trigger.recipients
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    if (recipients.length === 0) return;

    const subject = interpolate(trigger.subject, data);
    const html = interpolate(trigger.bodyHtml, data);
    const to = recipients.join(", ");

    const success = await sendEmail({ to, subject, html });

    await prisma.emailLog.create({
      data: {
        triggerId: trigger.id,
        event,
        recipients: to,
        subject,
        status: success ? "sent" : "failed",
        error: success ? null : "Email delivery failed",
      },
    });

    // Auto-log email to Activity History
    if (success) {
      try {
        await prisma.activityLog.create({
          data: {
            type: "email",
            direction: "outbound",
            subject,
            body: html,
            recipients: to,
            emailStatus: "sent",
            source: "email_trigger",
            sourceId: trigger.id,
          },
        });
      } catch {
        // Don't let activity logging fail the notification
      }
    }
  } catch (error) {
    console.error(`Notification error for event "${event}":`, error);

    try {
      await prisma.emailLog.create({
        data: {
          event,
          recipients: "",
          subject: event,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        },
      });
    } catch {
      // Don't let logging failures crash the app
    }
  }
}
