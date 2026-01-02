'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { sendEmail } from '@/lib/email';

export async function createTicket(formData: FormData) {
  const session = await getSession();

  if (!session) {
    return { error: 'Non autenticato' };
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const priority = formData.get('priority') as string;
  const customerId = formData.get('customer_id') as string;

  if (!title || title.trim().length === 0) {
    return { error: 'Il titolo è obbligatorio' };
  }

  try {
    await prisma.ticket.create({
      data: {
        tick_title: title.trim(),
        tick_description: description?.trim() || null,
        tick_priority: priority || 'medium',
        tick_status: 'open',
        tick_usr_id: session.usr_id,
        tick_cust_id: customerId && customerId !== '' ? parseInt(customerId) : null,
      },
    });

    revalidatePath('/dashboard/user/tickets');
    revalidatePath('/dashboard/admin/tickets');

    // Redirect based on role
    if (session.usr_role === 0) {
      redirect('/dashboard/admin/tickets');
    } else {
      redirect('/dashboard/user/tickets');
    }
  } catch (error: any) {
    // Re-throw redirect errors (they are not actual errors)
    if (error.message === 'NEXT_REDIRECT' || error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Error creating ticket:', error);
    return { error: 'Errore durante la creazione del ticket' };
  }
}

export async function createTicketWithAttachments(formData: FormData) {
  const session = await getSession();

  if (!session) {
    return { error: 'Non autenticato' };
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const priority = formData.get('priority') as string;
  const customerId = formData.get('customer_id') as string;
  const files = formData.getAll('attachments') as File[];

  if (!title || title.trim().length === 0) {
    return { error: 'Il titolo è obbligatorio' };
  }

  try {
    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        tick_title: title.trim(),
        tick_description: description?.trim() || null,
        tick_priority: priority || 'medium',
        tick_status: 'open',
        tick_usr_id: session.usr_id,
        tick_cust_id: customerId && customerId !== '' ? parseInt(customerId) : null,
      },
    });

    // Handle file uploads
    const uploadedFiles: Array<{ filename: string; path: string }> = [];

    if (files && files.length > 0) {
      // Create upload directory if it doesn't exist
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'tickets', ticket.tick_id.toString());
      await mkdir(uploadDir, { recursive: true });

      for (const file of files) {
        if (file.size === 0) continue; // Skip empty files

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          console.warn(`File ${file.name} troppo grande, saltato`);
          continue;
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}_${sanitizedName}`;
        const filepath = join(uploadDir, filename);

        // Write file to disk
        await writeFile(filepath, buffer);

        // Save to database
        await prisma.ticketAttachment.create({
          data: {
            att_tick_id: ticket.tick_id,
            att_filename: file.name,
            att_filepath: `/uploads/tickets/${ticket.tick_id}/${filename}`,
            att_filesize: file.size,
            att_mimetype: file.type || 'application/octet-stream',
          },
        });

        uploadedFiles.push({
          filename: file.name,
          path: filepath,
        });
      }
    }

    // Send emails if user has partner
    if (session.usr_part_id && session.partner) {
      console.log('[EMAIL] Utente ha partner:', session.usr_part_id);
      // Get partner email from database
      const partner = await prisma.partner.findUnique({
        where: { part_id: session.usr_part_id },
      });

      // Get customer info if ticket has one
      let customerName = '';
      if (ticket.tick_cust_id) {
        const customer = await prisma.customer.findUnique({
          where: { cust_id: ticket.tick_cust_id },
        });
        customerName = customer?.cust_name || '';
      }

      const partnerEmail = partner?.part_email;
      const partnerName = partner?.part_name;
      const partnerLogo = partner?.part_logo;
      console.log('[EMAIL] Partner email trovata:', partnerEmail || 'NESSUNA EMAIL');

      if (partnerEmail && partnerName) {
        // Prepare email HTML
        const emailHtml = `
          <h2>Nuovo Ticket Creato</h2>
          <p><strong>Da:</strong> ${session.usr_name}${customerName ? ` - <em>${customerName}</em>` : ''}</p>
          <p><strong>Provider:</strong> ${partnerName}</p>
          ${partnerLogo ? `<img src="${partnerLogo}" alt="Logo Partner" style="max-width: 200px; margin: 10px 0;" />` : ''}
          <hr>
          <h3>${title}</h3>
          ${description ? `<p style="font-style: italic;">${description}</p>` : ''}
          <hr>
          <p><strong>Priorità:</strong> ${priority}</p>
          <p><strong>Ticket ID:</strong> #${ticket.tick_id}</p>
          ${uploadedFiles.length > 0 ? `<p><strong>Allegati:</strong> ${uploadedFiles.length} file(s)</p>` : ''}
        `;

        const emailText = `Nuovo Ticket\n\nTitolo: ${title}\n\nDescrizione: ${description || 'Nessuna descrizione'}\n\nPriorità: ${priority}\nTicket ID: #${ticket.tick_id}`;

        // Email 1: Send to user (from partner)
        if (session.usr_mail) {
          console.log('[EMAIL] Invio email a utente:', session.usr_mail);
          const userEmailResult = await sendEmail({
            to: session.usr_mail,
            from: `${partnerName} <${partnerEmail}>`,
            subject: `Ricevuto Ticket #${ticket.tick_id}`,
            html: emailHtml,
            text: emailText,
            attachments: uploadedFiles,
          });
          console.log('[EMAIL] Risultato invio a utente:', userEmailResult);
        }

        // Email 2: Send to partner
        console.log('[EMAIL] Invio email a partner:', partnerEmail);
        const partnerEmailResult = await sendEmail({
          to: partnerEmail,
          subject: `Nuovo Ticket #${ticket.tick_id}: ${title}`,
          html: emailHtml,
          text: emailText,
          attachments: uploadedFiles,
        });
        console.log('[EMAIL] Risultato invio a partner:', partnerEmailResult);
      } else {
        console.log('[EMAIL] SKIP: Partner non ha email o nome configurati');
      }
    } else {
      console.log('[EMAIL] SKIP: Utente non ha partner associato');
    }

    revalidatePath('/dashboard/user/tickets');
    revalidatePath('/dashboard/admin/tickets');

    // Redirect based on role
    if (session.usr_role === 0) {
      redirect('/dashboard/admin/tickets');
    } else {
      redirect('/dashboard/user/tickets');
    }
  } catch (error: any) {
    // Re-throw redirect errors (they are not actual errors)
    if (error.message === 'NEXT_REDIRECT' || error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Error creating ticket:', error);
    return { error: 'Errore durante la creazione del ticket' };
  }
}

export async function updateTicketWithAttachments(ticketId: number, formData: FormData) {
  const session = await getSession();

  if (!session) {
    return { error: 'Non autenticato' };
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const priority = formData.get('priority') as string;
  const status = formData.get('status') as string;
  const files = formData.getAll('attachments') as File[];

  if (!title || title.trim().length === 0) {
    return { error: 'Il titolo è obbligatorio' };
  }

  try {
    // Verify ticket exists and user has permission
    const ticket = await prisma.ticket.findUnique({
      where: { tick_id: ticketId },
    });

    if (!ticket) {
      return { error: 'Ticket non trovato' };
    }

    // Admin can edit all, users can only edit their own
    if (session.usr_role !== 0 && session.usr_role !== 1 && ticket.tick_usr_id !== session.usr_id) {
      return { error: 'Non hai il permesso di modificare questo ticket' };
    }

    // Update ticket
    await prisma.ticket.update({
      where: { tick_id: ticketId },
      data: {
        tick_title: title.trim(),
        tick_description: description?.trim() || null,
        tick_priority: priority || 'medium',
        tick_status: status || ticket.tick_status,
      },
    });

    // Handle file uploads
    if (files && files.length > 0) {
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'tickets', ticketId.toString());
      await mkdir(uploadDir, { recursive: true });

      for (const file of files) {
        if (file.size === 0) continue;

        if (file.size > 10 * 1024 * 1024) {
          console.warn(`File ${file.name} troppo grande, saltato`);
          continue;
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}_${sanitizedName}`;
        const filepath = join(uploadDir, filename);

        await writeFile(filepath, buffer);

        await prisma.ticketAttachment.create({
          data: {
            att_tick_id: ticketId,
            att_filename: file.name,
            att_filepath: `/uploads/tickets/${ticketId}/${filename}`,
            att_filesize: file.size,
            att_mimetype: file.type || 'application/octet-stream',
          },
        });
      }
    }

    revalidatePath('/dashboard/user/tickets');
    revalidatePath('/dashboard/admin/tickets');
    revalidatePath(`/dashboard/user/tickets/${ticketId}/edit`);
    revalidatePath(`/dashboard/admin/tickets/${ticketId}/edit`);

    // Redirect based on role
    if (session.usr_role === 0 || session.usr_role === 1) {
      redirect('/dashboard/admin/tickets');
    } else {
      redirect('/dashboard/user/tickets');
    }
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT' || error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Error updating ticket:', error);
    return { error: 'Errore durante l\'aggiornamento del ticket' };
  }
}

export async function deleteTicket(ticketId: number) {
  const session = await getSession();

  if (!session) {
    return { error: 'Non autenticato' };
  }

  try {
    // Verify ticket exists and user has permission
    const ticket = await prisma.ticket.findUnique({
      where: { tick_id: ticketId },
    });

    if (!ticket) {
      return { error: 'Ticket non trovato' };
    }

    // Only admin/partner can delete
    if (session.usr_role !== 0 && session.usr_role !== 1) {
      return { error: 'Non hai il permesso di eliminare questo ticket' };
    }

    // Delete ticket (cascade will delete attachments and activities)
    await prisma.ticket.delete({
      where: { tick_id: ticketId },
    });

    revalidatePath('/dashboard/user/tickets');
    revalidatePath('/dashboard/admin/tickets');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting ticket:', error);
    return { error: 'Errore durante l\'eliminazione del ticket' };
  }
}

export async function updateTicketAndResendEmail(ticketId: number, formData: FormData) {
  const session = await getSession();

  if (!session) {
    return { error: 'Non autenticato' };
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const priority = formData.get('priority') as string;
  const status = formData.get('status') as string;
  const files = formData.getAll('attachments') as File[];

  if (!title || title.trim().length === 0) {
    return { error: 'Il titolo è obbligatorio' };
  }

  try {
    // Verify ticket exists and user has permission
    const ticket = await prisma.ticket.findUnique({
      where: { tick_id: ticketId },
      include: {
        user: {
          include: {
            partner: true,
          },
        },
        customer: true,
      },
    });

    if (!ticket) {
      return { error: 'Ticket non trovato' };
    }

    // Admin can edit all, users can only edit their own
    if (session.usr_role !== 0 && session.usr_role !== 1 && ticket.tick_usr_id !== session.usr_id) {
      return { error: 'Non hai il permesso di modificare questo ticket' };
    }

    // Update ticket
    await prisma.ticket.update({
      where: { tick_id: ticketId },
      data: {
        tick_title: title.trim(),
        tick_description: description?.trim() || null,
        tick_priority: priority || 'medium',
        tick_status: status || ticket.tick_status,
      },
    });

    // Handle file uploads
    if (files && files.length > 0) {
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'tickets', ticketId.toString());
      await mkdir(uploadDir, { recursive: true });

      for (const file of files) {
        if (file.size === 0) continue;

        if (file.size > 10 * 1024 * 1024) {
          console.warn(`File ${file.name} troppo grande, saltato`);
          continue;
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}_${sanitizedName}`;
        const filepath = join(uploadDir, filename);

        await writeFile(filepath, buffer);

        await prisma.ticketAttachment.create({
          data: {
            att_tick_id: ticketId,
            att_filename: file.name,
            att_filepath: `/uploads/tickets/${ticketId}/${filename}`,
            att_filesize: file.size,
            att_mimetype: file.type || 'application/octet-stream',
          },
        });
      }
    }

    // Resend emails
    if (ticket.user.usr_part_id && ticket.user.partner) {
      const partner = await prisma.partner.findUnique({
        where: { part_id: ticket.user.usr_part_id },
      });

      if (partner?.part_email && partner?.part_name) {
        // Get updated attachments
        const updatedTicket = await prisma.ticket.findUnique({
          where: { tick_id: ticketId },
          include: { attachments: true },
        });

        // Get customer name if exists
        let customerName = '';
        if (ticket.tick_cust_id && ticket.customer) {
          customerName = ticket.customer.cust_name || '';
        }

        // Build attachment paths for email
        const uploadedFiles: Array<{ filename: string; path: string }> = [];
        if (updatedTicket?.attachments && updatedTicket.attachments.length > 0) {
          for (const att of updatedTicket.attachments) {
            const filepath = join(process.cwd(), 'public', att.att_filepath);
            uploadedFiles.push({
              filename: att.att_filename,
              path: filepath,
            });
          }
        }

        const emailHtml = `
          <h2>Nuovo Ticket Creato</h2>
          <p><strong>Da:</strong> ${ticket.user.usr_name}${customerName ? ` - <em>${customerName}</em>` : ''}</p>
          <p><strong>Provider:</strong> ${partner.part_name}</p>
          ${partner.part_logo ? `<img src="${partner.part_logo}" alt="Logo Partner" style="max-width: 200px; margin: 10px 0;" />` : ''}
          <hr>
          <h3>${title}</h3>
          ${description ? `<p style="font-style: italic;">${description}</p>` : ''}
          <hr>
          <p><strong>Priorità:</strong> ${priority}</p>
          <p><strong>Ticket ID:</strong> #${ticketId}</p>
          ${uploadedFiles.length > 0 ? `<p><strong>Allegati:</strong> ${uploadedFiles.length} file(s)</p>` : ''}
        `;

        const emailText = `Nuovo Ticket\n\nTitolo: ${title}\n\nDescrizione: ${description || 'Nessuna descrizione'}\n\nPriorità: ${priority}\nTicket ID: #${ticketId}`;

        // Email 1: Send to user (from partner)
        if (ticket.user.usr_mail) {
          console.log('[EMAIL] Reinvio email a utente:', ticket.user.usr_mail);
          await sendEmail({
            to: ticket.user.usr_mail,
            from: `${partner.part_name} <${partner.part_email}>`,
            subject: `Ricevuto Ticket #${ticketId}`,
            html: emailHtml,
            text: emailText,
            attachments: uploadedFiles,
          });
        }

        // Email 2: Send to partner
        console.log('[EMAIL] Reinvio email a partner:', partner.part_email);
        await sendEmail({
          to: partner.part_email,
          subject: `Nuovo Ticket #${ticketId}: ${title}`,
          html: emailHtml,
          text: emailText,
          attachments: uploadedFiles,
        });
      }
    }

    revalidatePath('/dashboard/user/tickets');
    revalidatePath('/dashboard/admin/tickets');
    revalidatePath(`/dashboard/user/tickets/${ticketId}/edit`);
    revalidatePath(`/dashboard/admin/tickets/${ticketId}/edit`);

    // Redirect based on role
    if (session.usr_role === 0 || session.usr_role === 1) {
      redirect('/dashboard/admin/tickets');
    } else {
      redirect('/dashboard/user/tickets');
    }
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT' || error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Error updating ticket:', error);
    return { error: 'Errore durante l\'aggiornamento del ticket' };
  }
}

export async function resendTicketEmail(ticketId: number) {
  const session = await getSession();

  if (!session) {
    return { error: 'Non autenticato' };
  }

  try {
    // Get ticket with all relations
    const ticket = await prisma.ticket.findUnique({
      where: { tick_id: ticketId },
      include: {
        user: {
          include: {
            partner: true,
          },
        },
        customer: true,
        attachments: true,
      },
    });

    if (!ticket) {
      return { error: 'Ticket non trovato' };
    }

    // Check if user has a partner
    if (!ticket.user.usr_part_id || !ticket.user.partner) {
      return { error: 'Utente non ha un partner associato' };
    }

    // Get partner
    const partner = await prisma.partner.findUnique({
      where: { part_id: ticket.user.usr_part_id },
    });

    if (!partner || !partner.part_email) {
      return { error: 'Partner non ha email configurata' };
    }

    // Get customer name if exists
    let customerName = '';
    if (ticket.tick_cust_id && ticket.customer) {
      customerName = ticket.customer.cust_name || '';
    }

    // Build attachment paths for email
    const uploadedFiles: Array<{ filename: string; path: string }> = [];
    if (ticket.attachments && ticket.attachments.length > 0) {
      for (const att of ticket.attachments) {
        const filepath = join(process.cwd(), 'public', att.att_filepath);
        uploadedFiles.push({
          filename: att.att_filename,
          path: filepath,
        });
      }
    }

    // Send email
    const emailHtml = `
      <h2>Nuovo Ticket Creato</h2>
      <p><strong>Da:</strong> ${ticket.user.usr_name}${customerName ? ` - <em>${customerName}</em>` : ''}</p>
      <p><strong>Provider:</strong> ${ticket.user.partner.part_name}</p>
      ${partner.part_logo ? `<img src="${partner.part_logo}" alt="Logo Partner" style="max-width: 200px; margin: 10px 0;" />` : ''}
      <hr>
      <h3>${ticket.tick_title}</h3>
      ${ticket.tick_description ? `<p style="font-style: italic;">${ticket.tick_description}</p>` : ''}
      <hr>
      <p><strong>Priorità:</strong> ${ticket.tick_priority}</p>
      <p><strong>Ticket ID:</strong> #${ticket.tick_id}</p>
      ${uploadedFiles.length > 0 ? `<p><strong>Allegati:</strong> ${uploadedFiles.length} file(s)</p>` : ''}
    `;

    const emailResult = await sendEmail({
      to: partner.part_email,
      subject: `Nuovo Ticket #${ticket.tick_id}: ${ticket.tick_title}`,
      html: emailHtml,
      text: `Nuovo Ticket\n\nTitolo: ${ticket.tick_title}\n\nDescrizione: ${ticket.tick_description || 'Nessuna descrizione'}\n\nPriorità: ${ticket.tick_priority}\nTicket ID: #${ticket.tick_id}`,
      attachments: uploadedFiles,
    });

    if (emailResult.success) {
      return { success: true, message: 'Email reinviata con successo' };
    } else {
      return { error: emailResult.error || 'Errore durante l\'invio dell\'email' };
    }
  } catch (error: any) {
    console.error('Error resending email:', error);
    return { error: 'Errore durante l\'invio dell\'email' };
  }
}
