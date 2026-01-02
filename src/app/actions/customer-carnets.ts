'use server';

import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createCustomerCarnet(customerId: number, formData: FormData) {
  await requireRole([0, 1]);  // Admin and Partner

  const carnetId = formData.get('carnet_id') as string;
  const dateStart = formData.get('date_start') as string;
  const dateEnd = formData.get('date_end') as string;
  const qtaEro = formData.get('qta_ero') as string;
  const note = formData.get('note') as string;
  const active = formData.get('active') === 'true';

  if (!carnetId) {
    return { error: 'Il carnet è obbligatorio' };
  }

  try {
    // Get the carnet to retrieve carn_qta
    const carnet = await prisma.carnet.findUnique({
      where: { carn_id: parseInt(carnetId) },
    });

    if (!carnet) {
      return { error: 'Carnet non trovato' };
    }

    await prisma.customerCarnet.create({
      data: {
        cuscarn_cust_id: customerId,
        cuscarn_carn_id: parseInt(carnetId),
        cuscarn_datestart: dateStart ? new Date(dateStart) : null,
        cuscarn_dateend: dateEnd ? new Date(dateEnd) : null,
        cuscarn_qtaini: carnet.carn_qta,  // Set from carnet.carn_qta
        cuscarn_qtaero: qtaEro ? parseInt(qtaEro) : 0,
        cuscarn_note: note || null,
        cuscarn_active: active,
      },
    });
  } catch (error) {
    return { error: 'Errore durante la creazione del carnet' };
  }

  // Revalidate and redirect OUTSIDE try-catch (redirect throws a special error)
  revalidatePath(`/dashboard/admin/customers/${customerId}/carnets`);
  redirect(`/dashboard/admin/customers/${customerId}/carnets`);
}

export async function updateCustomerCarnet(customerCarnetId: number, customerId: number, formData: FormData) {
  await requireRole([0, 1]);  // Admin and Partner

  const carnetId = formData.get('carnet_id') as string;
  const dateStart = formData.get('date_start') as string;
  const dateEnd = formData.get('date_end') as string;
  const qtaEro = formData.get('qta_ero') as string;
  const note = formData.get('note') as string;
  const active = formData.get('active') === 'true';

  if (!carnetId) {
    return { error: 'Il carnet è obbligatorio' };
  }

  try {
    // Get current customer carnet
    const currentCustomerCarnet = await prisma.customerCarnet.findUnique({
      where: { cuscarn_id: customerCarnetId },
    });

    if (!currentCustomerCarnet) {
      return { error: 'Carnet cliente non trovato' };
    }

    // Check if carnet has changed
    const carnetHasChanged = currentCustomerCarnet.cuscarn_carn_id !== parseInt(carnetId);

    let qtaIni = currentCustomerCarnet.cuscarn_qtaini;

    // If carnet changed, update qtaini from new carnet
    if (carnetHasChanged) {
      const newCarnet = await prisma.carnet.findUnique({
        where: { carn_id: parseInt(carnetId) },
      });

      if (!newCarnet) {
        return { error: 'Carnet non trovato' };
      }

      qtaIni = newCarnet.carn_qta;
    }

    await prisma.customerCarnet.update({
      where: { cuscarn_id: customerCarnetId },
      data: {
        cuscarn_carn_id: parseInt(carnetId),
        cuscarn_datestart: dateStart ? new Date(dateStart) : null,
        cuscarn_dateend: dateEnd ? new Date(dateEnd) : null,
        cuscarn_qtaini: qtaIni,  // Update only if carnet changed
        cuscarn_qtaero: qtaEro ? parseInt(qtaEro) : 0,
        cuscarn_note: note || null,
        cuscarn_active: active,
      },
    });
  } catch (error) {
    return { error: 'Errore durante l\'aggiornamento del carnet' };
  }

  // Revalidate and redirect OUTSIDE try-catch (redirect throws a special error)
  revalidatePath(`/dashboard/admin/customers/${customerId}/carnets`);
  redirect(`/dashboard/admin/customers/${customerId}/carnets`);
}

export async function deleteCustomerCarnet(customerCarnetId: number, customerId: number) {
  await requireRole([0, 1]);  // Admin and Partner

  try {
    await prisma.customerCarnet.delete({
      where: { cuscarn_id: customerCarnetId },
    });

    revalidatePath(`/dashboard/admin/customers/${customerId}/carnets`);
    return { success: true };
  } catch (error) {
    return { error: 'Errore durante l\'eliminazione del carnet' };
  }
}
