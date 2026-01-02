'use server';

import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
  await requireRole([0]);

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = parseInt(formData.get('role') as string);
  const customerId = formData.get('customer_id') as string;
  const partnerId = formData.get('partner_id') as string;
  const note = formData.get('note') as string;

  if (!email || !password) {
    return { error: 'Email e password sono obbligatori' };
  }

  try {
    await prisma.user.create({
      data: {
        usr_name: name || null,
        usr_mail: email,
        usr_pwd: password,
        usr_role: role,
        usr_cust_id: customerId && customerId !== '' ? parseInt(customerId) : null,
        usr_part_id: partnerId && partnerId !== '' ? parseInt(partnerId) : null,
        usr_note: note || null,
      },
    });

    revalidatePath('/dashboard/admin/users');
    redirect('/dashboard/admin/users');
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Email già esistente' };
    }
    return { error: 'Errore durante la creazione dell\'utente' };
  }
}

export async function updateUser(userId: number, formData: FormData) {
  await requireRole([0]);

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = parseInt(formData.get('role') as string);
  const customerId = formData.get('customer_id') as string;
  const partnerId = formData.get('partner_id') as string;
  const note = formData.get('note') as string;

  if (!email) {
    return { error: 'Email è obbligatoria' };
  }

  try {
    const updateData: any = {
      usr_name: name || null,
      usr_mail: email,
      usr_role: role,
      usr_cust_id: customerId && customerId !== '' ? parseInt(customerId) : null,
      usr_part_id: partnerId && partnerId !== '' ? parseInt(partnerId) : null,
      usr_note: note || null,
    };

    // Only update password if provided
    if (password && password.trim() !== '') {
      updateData.usr_pwd = password;
    }

    await prisma.user.update({
      where: { usr_id: userId },
      data: updateData,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Email già esistente' };
    }
    return { error: 'Errore durante l\'aggiornamento dell\'utente' };
  }

  revalidatePath('/dashboard/admin/users');
  redirect('/dashboard/admin/users');
}

export async function deleteUser(userId: number, confirmed: boolean = false) {
  await requireRole([0]);

  try {
    // Check for related tickets
    const ticketCount = await prisma.ticket.count({
      where: { tick_usr_id: userId },
    });

    // If there are tickets and not confirmed, return warning
    if (ticketCount > 0 && !confirmed) {
      return {
        warning: true,
        ticketCount,
        message: `Questo utente ha ${ticketCount} ticket collegati. Eliminando l'utente verranno eliminati anche tutti i ticket. Sei sicuro?`
      };
    }

    // Delete all related tickets first
    await prisma.ticket.deleteMany({
      where: { tick_usr_id: userId },
    });

    // Then delete the user
    await prisma.user.delete({
      where: { usr_id: userId },
    });

    revalidatePath('/dashboard/admin/users');
    return { success: true };
  } catch (error) {
    return { error: 'Errore durante l\'eliminazione dell\'utente' };
  }
}
