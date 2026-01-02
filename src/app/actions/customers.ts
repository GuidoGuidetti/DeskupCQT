'use server';

import { prisma } from '@/lib/prisma';
import { requireRole, getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createCustomer(formData: FormData) {
  const session = await requireRole([0, 1]);  // Admin and Partner

  const name = formData.get('name') as string;
  const code = formData.get('code') as string;
  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const country = formData.get('country') as string;
  const partnerIdStr = formData.get('partner') as string;

  if (!name) {
    return { error: 'Il nome è obbligatorio' };
  }

  // Determine partner ID
  let partnerId: number | null = null;
  if (session.usr_role === 1) {
    // Partner users can only assign their own partner
    partnerId = session.usr_part_id;
  } else if (partnerIdStr && partnerIdStr !== '') {
    // Admin can select any partner from dropdown
    partnerId = parseInt(partnerIdStr);
  }

  try {
    await prisma.customer.create({
      data: {
        cust_name: name,
        cust_code: code || null,
        cust_address: address || null,
        cust_city: city || null,
        cust_state: state || null,
        cust_country: country || 'ITALY',
        cust_part_id: partnerId,
      },
    });

    revalidatePath('/dashboard/admin/customers');
    redirect('/dashboard/admin/customers');
  } catch (error) {
    return { error: 'Errore durante la creazione del cliente' };
  }
}

export async function updateCustomer(customerId: number, formData: FormData) {
  const session = await requireRole([0, 1]);  // Admin and Partner

  const name = formData.get('name') as string;
  const code = formData.get('code') as string;
  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const country = formData.get('country') as string;
  const partnerIdStr = formData.get('partner') as string;

  if (!name) {
    return { error: 'Il nome è obbligatorio' };
  }

  // Determine partner ID
  let partnerId: number | null = null;
  if (session.usr_role === 1) {
    // Partner users keep their own partner
    partnerId = session.usr_part_id;
  } else if (partnerIdStr && partnerIdStr !== '') {
    // Admin can change partner from dropdown
    partnerId = parseInt(partnerIdStr);
  }

  try {
    await prisma.customer.update({
      where: { cust_id: customerId },
      data: {
        cust_name: name,
        cust_code: code || null,
        cust_address: address || null,
        cust_city: city || null,
        cust_state: state || null,
        cust_country: country || 'ITALY',
        cust_part_id: partnerId,
      },
    });

    revalidatePath('/dashboard/admin/customers');
    redirect('/dashboard/admin/customers');
  } catch (error) {
    return { error: 'Errore durante l\'aggiornamento del cliente' };
  }
}

// Check if customer has related tickets
export async function checkCustomerTickets(customerId: number) {
  await requireRole([0, 1]);  // Admin and Partner

  const ticketCount = await prisma.ticket.count({
    where: { tick_cust_id: customerId },
  });

  return { ticketCount };
}

// Delete customer and all related data
export async function deleteCustomer(customerId: number, confirmed: boolean = false) {
  await requireRole([0, 1]);  // Admin and Partner

  try {
    // Check for related tickets
    const ticketCount = await prisma.ticket.count({
      where: { tick_cust_id: customerId },
    });

    // If there are tickets and not confirmed, return warning
    if (ticketCount > 0 && !confirmed) {
      return {
        warning: true,
        ticketCount,
        message: `Questo cliente ha ${ticketCount} ticket collegati. Eliminando il cliente verranno eliminati anche tutti i ticket. Sei sicuro?`
      };
    }

    // Delete all related tickets first
    await prisma.ticket.deleteMany({
      where: { tick_cust_id: customerId },
    });

    // Then delete the customer
    await prisma.customer.delete({
      where: { cust_id: customerId },
    });

    revalidatePath('/dashboard/admin/customers');
    return { success: true };
  } catch (error) {
    return { error: 'Errore durante l\'eliminazione del cliente' };
  }
}
