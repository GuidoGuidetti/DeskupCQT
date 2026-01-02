'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireRole, getSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import nodemailer from 'nodemailer';
import { getActivityEmailTemplate, getActivityEmailText } from '@/lib/email-templates';
import {
  translateUnitOfMeasure,
  minutesToFormatted,
  translateTicketStatus,
  translateCarnetType
} from '@/lib/activity-calculations';
import ExcelJS from 'exceljs';

// Helper function to sanitize filename
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Create new activity with attachments
 */
export async function createActivityWithAttachments(
  formData: FormData,
  sendEmail: boolean = true
) {
  // Extract form data BEFORE try block (needed for redirect)
  const act_tick_id = parseInt(formData.get('act_tick_id') as string);

  try {
    // Require admin/partner role
    await requireRole([0, 1]);
    const session = await getSession();

    // Extract remaining form data
    const act_cust_id = parseInt(formData.get('act_cust_id') as string);
    const act_cuscarn_id = parseInt(formData.get('act_cuscarn_id') as string);
    const act_description = formData.get('act_description') as string;
    const act_response = (formData.get('act_response') as string) || null;
    const act_date = formData.get('act_date') as string;
    const act_start_time = formData.get('act_start_time') as string;
    const act_end_time = formData.get('act_end_time') as string;
    const act_time = parseInt(formData.get('act_time') as string); // minutes
    const act_unit_qta = parseFloat(formData.get('act_unit_qta') as string);
    const act_price = parseFloat(formData.get('act_price') as string);
    const act_value = parseFloat(formData.get('act_value') as string);
    const act_note = (formData.get('act_note') as string) || null;
    const act_close = formData.get('act_close') === 'true';

    // Validate required fields
    if (!act_tick_id || !act_cust_id || !act_cuscarn_id || !act_description) {
      return { error: 'Campi obbligatori mancanti' };
    }

    // Fetch ticket, customer, and carnet data
    const ticket = await prisma.ticket.findUnique({
      where: { tick_id: act_tick_id },
      include: { user: true, customer: true },
    });

    if (!ticket) {
      return { error: 'Ticket non trovato' };
    }

    const customerCarnet = await prisma.customerCarnet.findUnique({
      where: { cuscarn_id: act_cuscarn_id },
      include: { carnet: true },
    });

    if (!customerCarnet || !customerCarnet.carnet) {
      return { error: 'Carnet non trovato' };
    }

    // Check carnet quantity based on type
    const carnetType = customerCarnet.carnet?.carn_type || 'C';
    const qtaErogata = Number(customerCarnet.cuscarn_qtaero) || 0;
    const qtaIni = Number(customerCarnet.cuscarn_qtaini) || 0;
    const newQtaErogata = qtaErogata + Number(act_unit_qta);

    // For Carnet type ('C'), check if we exceed initial quantity
    if (carnetType === 'C' && newQtaErogata > qtaIni) {
      return { error: `Attenzione: la quantità erogata totale (${newQtaErogata.toFixed(2)}) supererebbe la quantità iniziale del carnet (${qtaIni}). Operazione annullata.` };
    }
    // For Consuntivo type ('F'), no limit check needed

    // Convert time strings to proper format for PostgreSQL Time type
    const startTimeForDb = `${act_start_time}:00`; // Add seconds
    const endTimeForDb = `${act_end_time}:00`;
    const dateForDb = new Date(act_date);

    // Create activity
    const activity = await prisma.activity.create({
      data: {
        act_tick_id,
        act_cust_id,
        act_cuscarn_id,
        act_description,
        act_response,
        act_date: dateForDb,
        act_start_time: new Date(`1970-01-01T${startTimeForDb}`),
        act_end_time: new Date(`1970-01-01T${endTimeForDb}`),
        act_time,
        act_unit_qta,
        act_price,
        act_value,
        act_note,
        act_close,
      },
    });

    // Handle file uploads
    const files = formData.getAll('attachments') as File[];
    const uploadedFiles: string[] = [];

    if (files && files.length > 0) {
      // Create upload directory
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'activities', activity.act_id.toString());

      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      for (const file of files) {
        if (file && file.size > 0) {
          // Validate file size (10MB max)
          if (file.size > 10 * 1024 * 1024) {
            console.warn(`File ${file.name} too large, skipping`);
            continue;
          }

          const sanitizedName = sanitizeFilename(file.name);
          const timestamp = Date.now();
          const uniqueFilename = `${timestamp}_${sanitizedName}`;
          const filepath = join(uploadDir, uniqueFilename);

          // Write file
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          await writeFile(filepath, buffer);

          const publicPath = `/uploads/activities/${activity.act_id}/${uniqueFilename}`;
          uploadedFiles.push(publicPath);

          // Create attachment record
          await prisma.activityAttachment.create({
            data: {
              act_att_act_id: activity.act_id,
              act_att_filename: file.name,
              act_att_filepath: publicPath,
              act_att_filesize: file.size,
              act_att_mimetype: file.type || 'application/octet-stream',
            },
          });
        }
      }
    }

    // Update carnet - increment quantity used (erogata)
    await prisma.customerCarnet.update({
      where: { cuscarn_id: act_cuscarn_id },
      data: {
        cuscarn_qtaero: {
          increment: act_unit_qta,
        },
      },
    });

    // Close ticket if requested
    if (act_close) {
      await prisma.ticket.update({
        where: { tick_id: act_tick_id },
        data: {
          tick_status: 'closed',
          tick_closed_at: new Date(),
        },
      });
    }

    // Send email notification if requested
    if (sendEmail && ticket.user.usr_mail) {
      try {
        console.log(`[EMAIL] Tentativo di invio email per attività Ticket #${ticket.tick_id}...`);

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const emailData = {
          ticketId: ticket.tick_id,
          ticketTitle: ticket.tick_title,
          customerName: ticket.customer?.cust_name || null,
          partnerName: session?.partner?.part_name || 'Provider',
          partnerLogo: session?.partner?.part_logo
            ? `${process.env.NEXT_PUBLIC_BASE_URL || ''}${session.partner.part_logo}`
            : null,
          activityResponse: act_response || act_description,
          unitQuantity: act_unit_qta,
          unitOfMeasure: customerCarnet.carnet.carn_um || 'T',
          isClosed: act_close,
          attachmentsCount: uploadedFiles.length,
        };

        const htmlContent = getActivityEmailTemplate(emailData);
        const textContent = getActivityEmailText(emailData);

        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: ticket.user.usr_mail,
          subject: `Aggiornamento Ticket #${ticket.tick_id}: ${ticket.tick_title}`,
          text: textContent,
          html: htmlContent,
        });

        console.log(`[EMAIL] ✓ Email inviata con successo a: ${ticket.user.usr_mail}`);
        console.log(`[EMAIL]   - Utente: ${ticket.user.usr_name}`);
        console.log(`[EMAIL]   - Ticket: #${ticket.tick_id} - ${ticket.tick_title}`);
      } catch (emailError) {
        console.error(`[EMAIL] ✗ ERRORE durante l'invio dell'email a: ${ticket.user.usr_mail}`);
        console.error(`[EMAIL]   - Utente: ${ticket.user.usr_name}`);
        console.error(`[EMAIL]   - Ticket: #${ticket.tick_id}`);
        console.error(`[EMAIL]   - Dettaglio errore:`, emailError);
        // Don't fail the entire operation if email fails
      }
    } else if (sendEmail && !ticket.user.usr_mail) {
      console.warn(`[EMAIL] ⚠ Email non inviata: l'utente ${ticket.user.usr_name} non ha un indirizzo email configurato`);
    }
  } catch (error) {
    console.error('Error creating activity:', error);
    return { error: 'Errore durante la creazione dell\'attività' };
  }

  // Revalidate and redirect OUTSIDE try-catch (redirect throws a special error)
  revalidatePath(`/dashboard/admin/tickets/${act_tick_id}/activities`);
  redirect(`/dashboard/admin/tickets/${act_tick_id}/activities`);
}

/**
 * Delete activity and rollback changes
 */
export async function deleteActivity(activityId: number) {
  try {
    // Require admin/partner role
    await requireRole([0, 1]);

    // Fetch activity with relations
    const activity = await prisma.activity.findUnique({
      where: { act_id: activityId },
      include: {
        ticket: true,
        customerCarnet: true,
      },
    });

    if (!activity) {
      return { error: 'Attività non trovata' };
    }

    const ticketId = activity.act_tick_id;
    const wasClosing = activity.act_close;
    const unitQta = activity.act_unit_qta;
    const carnetId = activity.act_cuscarn_id;

    // Delete activity (cascade will delete attachments)
    await prisma.activity.delete({
      where: { act_id: activityId },
    });

    // Rollback carnet - decrement quantity used (erogata)
    await prisma.customerCarnet.update({
      where: { cuscarn_id: carnetId },
      data: {
        cuscarn_qtaero: {
          decrement: Number(unitQta),
        },
      },
    });

    // If this activity closed the ticket, reopen it
    if (wasClosing) {
      // Check if there are other activities that close the ticket
      const otherClosingActivities = await prisma.activity.findFirst({
        where: {
          act_tick_id: ticketId,
          act_close: true,
          act_id: { not: activityId },
        },
      });

      // Only reopen if no other activities close it
      if (!otherClosingActivities) {
        await prisma.ticket.update({
          where: { tick_id: ticketId },
          data: {
            tick_status: 'in_progress',
            tick_closed_at: null,
          },
        });
      }
    }

    revalidatePath(`/dashboard/admin/tickets/${ticketId}/activities`);
    revalidatePath('/dashboard/admin/tickets');
    return { success: true };
  } catch (error) {
    console.error('Error deleting activity:', error);
    return { error: 'Errore durante l\'eliminazione dell\'attività' };
  }
}

/**
 * Export activities to Excel file
 */
export async function exportActivitiesToExcel(formData: FormData) {
  try {
    // Require admin/partner role
    await requireRole([0, 1]);
    const session = await getSession();

    // Extract filter parameters
    const filterUser = formData.get('filterUser') as string;
    const filterCustomer = formData.get('filterCustomer') as string;
    const filterStatus = formData.get('filterStatus') as string;

    // Build where clause
    const whereClause: any = {};

    // Partner filtering (SECURITY - server-side only)
    if (session?.usr_role === 1 && session.usr_part_id) {
      whereClause.customer = {
        cust_part_id: session.usr_part_id
      };
    }

    // User filter
    if (filterUser && filterUser !== 'all') {
      whereClause.ticket = {
        ...whereClause.ticket,
        tick_usr_id: parseInt(filterUser)
      };
    }

    // Customer filter
    if (filterCustomer && filterCustomer !== 'all') {
      whereClause.act_cust_id = parseInt(filterCustomer);
    }

    // Status filter (via ticket relation)
    if (filterStatus && filterStatus !== 'all') {
      whereClause.ticket = {
        ...whereClause.ticket,
        tick_status: filterStatus
      };
    }

    // Fetch activities with all relations
    const activities = await prisma.activity.findMany({
      where: whereClause,
      include: {
        ticket: {
          include: {
            user: true
          }
        },
        customer: true,
        customerCarnet: {
          include: {
            carnet: true
          }
        }
      },
      orderBy: {
        act_date: 'desc'
      }
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attività');

    // Define columns
    worksheet.columns = [
      { header: 'Data', key: 'data', width: 12 },
      { header: 'Orario', key: 'orario', width: 15 },
      { header: 'Tempo', key: 'tempo', width: 10 },
      { header: 'Nome Cliente', key: 'cliente', width: 25 },
      { header: 'Nome User', key: 'user', width: 25 },
      { header: 'ID Ticket', key: 'ticket_id', width: 12 },
      { header: 'Titolo Ticket', key: 'titolo', width: 35 },
      { header: 'UM', key: 'um', width: 12 },
      { header: 'Tipo Carnet', key: 'tipo', width: 15 },
      { header: 'Qtà', key: 'qta', width: 10 },
      { header: 'Valore', key: 'valore', width: 12 },
      { header: 'Stato', key: 'stato', width: 15 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Helper function to format time from DateTime
    const formatTime = (dateTime: Date) => {
      return dateTime.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    };

    // Add data rows
    activities.forEach(activity => {
      worksheet.addRow({
        data: activity.act_date.toLocaleDateString('it-IT'),
        orario: `${formatTime(activity.act_start_time)} - ${formatTime(activity.act_end_time)}`,
        tempo: minutesToFormatted(activity.act_time),
        cliente: activity.customer.cust_name || '-',
        user: activity.ticket.user.usr_name || '-',
        ticket_id: activity.act_tick_id,
        titolo: activity.ticket.tick_title,
        um: translateUnitOfMeasure(activity.customerCarnet.carnet?.carn_um || 'T'),
        tipo: translateCarnetType(activity.customerCarnet.carnet?.carn_type || 'C'),
        qta: Number(activity.act_unit_qta),
        valore: Number(activity.act_value),
        stato: translateTicketStatus(activity.ticket.tick_status)
      });
    });

    // Apply number format to Qtà column (column 10)
    worksheet.getColumn(10).numFmt = '0.00';

    // Apply currency format to Valore column (column 11)
    worksheet.getColumn(11).numFmt = '€#,##0.00';

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `attivita_${timestamp}.xlsx`;

    // Create exports directory if it doesn't exist
    const exportsDir = join(process.cwd(), 'public', 'exports');
    if (!existsSync(exportsDir)) {
      await mkdir(exportsDir, { recursive: true });
    }

    // Write file
    const filepath = join(exportsDir, filename);
    await workbook.xlsx.writeFile(filepath);

    // Return download URL
    return {
      success: true,
      fileUrl: `/exports/${filename}`,
      filename: filename
    };
  } catch (error) {
    console.error('Error exporting activities to Excel:', error);
    return { error: 'Errore durante l\'esportazione in Excel' };
  }
}
