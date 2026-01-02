/**
 * Email Templates for Activity Notifications
 */

import { translateUnitOfMeasure } from './activity-calculations';

interface ActivityEmailData {
  ticketId: number;
  ticketTitle: string;
  customerName?: string | null;
  partnerName: string;
  partnerLogo?: string | null;
  activityResponse: string; // act_response or act_description
  unitQuantity: number;
  unitOfMeasure: string; // G, H, or T
  isClosed: boolean;
  attachmentsCount: number;
}

/**
 * Generate HTML email template for activity notification
 */
export function getActivityEmailTemplate(data: ActivityEmailData): string {
  const {
    ticketId,
    ticketTitle,
    customerName,
    partnerName,
    partnerLogo,
    activityResponse,
    unitQuantity,
    unitOfMeasure,
    isClosed,
    attachmentsCount,
  } = data;

  const umLabel = translateUnitOfMeasure(unitOfMeasure);
  const partnerLogoHtml = partnerLogo
    ? `<img src="${partnerLogo}" alt="Logo Provider" style="max-width: 200px; margin: 10px 0;" />`
    : '';

  const closedBadgeHtml = isClosed
    ? `<div style="display: inline-block; background-color: #dc2626; color: white; padding: 8px 16px; border-radius: 6px; font-weight: bold; margin: 16px 0;">
         TICKET CHIUSO
       </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aggiornamento Ticket #${ticketId}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">

    <h2 style="color: #1f2937; margin-top: 0;">Aggiornamento Ticket</h2>

    ${customerName ? `<p><strong>Cliente:</strong> ${customerName}</p>` : ''}

    <p><strong>Provider:</strong> ${partnerName}</p>
    ${partnerLogoHtml}

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">

    <h3 style="color: #1f2937;">Ticket #${ticketId}: ${ticketTitle}</h3>

    <div style="background-color: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 16px 0;">
      <p style="font-style: italic; color: #4b5563; margin: 0; white-space: pre-wrap;">${activityResponse}</p>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">

    <div style="background-color: #eff6ff; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
      <p style="margin: 0;"><strong>Tempo impiegato:</strong> ${unitQuantity} ${umLabel}</p>
    </div>

    ${attachmentsCount > 0 ? `
      <p><strong>Allegati:</strong> ${attachmentsCount} file allegat${attachmentsCount === 1 ? 'o' : 'i'}</p>
    ` : ''}

    ${closedBadgeHtml}

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">

    <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0;">
      Questa è una notifica automatica. Per ulteriori dettagli, accedi al sistema.
    </p>

  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email template for activity notification
 */
export function getActivityEmailText(data: ActivityEmailData): string {
  const {
    ticketId,
    ticketTitle,
    customerName,
    partnerName,
    activityResponse,
    unitQuantity,
    unitOfMeasure,
    isClosed,
    attachmentsCount,
  } = data;

  const umLabel = translateUnitOfMeasure(unitOfMeasure);
  const customerLine = customerName ? `Cliente: ${customerName}\n` : '';
  const closedText = isClosed ? '\n*** TICKET CHIUSO ***\n' : '';
  const attachmentsLine = attachmentsCount > 0
    ? `\nAllegati: ${attachmentsCount} file allegat${attachmentsCount === 1 ? 'o' : 'i'}`
    : '';

  return `
AGGIORNAMENTO TICKET

${customerLine}Provider: ${partnerName}

---

Ticket #${ticketId}: ${ticketTitle}

${activityResponse}

---

Tempo impiegato: ${unitQuantity} ${umLabel}${attachmentsLine}${closedText}

Questa è una notifica automatica. Per ulteriori dettagli, accedi al sistema.
  `.trim();
}
