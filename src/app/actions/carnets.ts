'use server';

import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createCarnet(formData: FormData) {
  await requireRole([0, 1]);  // Admin and Partner

  const description = formData.get('description') as string;
  const type = formData.get('type') as string;
  const unit = formData.get('unit') as string;
  const value = formData.get('value') as string;
  const quantity = formData.get('quantity') as string;
  const price = formData.get('price') as string;
  const note = formData.get('note') as string;

  if (!description) {
    return { error: 'La descrizione è obbligatoria' };
  }

  try {
    await prisma.carnet.create({
      data: {
        carn_des: description,
        carn_type: type || 'C',
        carn_um: unit || null,
        carn_qta: quantity ? parseInt(quantity) : null,
        carn_value: value ? parseFloat(value) : null,
        carn_price: price ? parseFloat(price) : null,
        carn_note: note || null,
      },
    });
  } catch (error) {
    return { error: 'Errore durante la creazione del carnet' };
  }

  // Revalidate and redirect OUTSIDE try-catch
  revalidatePath('/dashboard/admin/carnets');
  redirect('/dashboard/admin/carnets');
}

export async function updateCarnet(carnetId: number, formData: FormData) {
  await requireRole([0, 1]);  // Admin and Partner

  const description = formData.get('description') as string;
  const type = formData.get('type') as string;
  const unit = formData.get('unit') as string;
  const value = formData.get('value') as string;
  const quantity = formData.get('quantity') as string;
  const price = formData.get('price') as string;
  const note = formData.get('note') as string;

  if (!description) {
    return { error: 'La descrizione è obbligatoria' };
  }

  try {
    await prisma.carnet.update({
      where: { carn_id: carnetId },
      data: {
        carn_des: description,
        carn_type: type || 'C',
        carn_um: unit || null,
        carn_qta: quantity ? parseInt(quantity) : null,
        carn_value: value ? parseFloat(value) : null,
        carn_price: price ? parseFloat(price) : null,
        carn_note: note || null,
      },
    });
  } catch (error) {
    return { error: 'Errore durante l\'aggiornamento del carnet' };
  }

  // Revalidate and redirect OUTSIDE try-catch
  revalidatePath('/dashboard/admin/carnets');
  redirect('/dashboard/admin/carnets');
}

export async function deleteCarnet(carnetId: number) {
  await requireRole([0, 1]);  // Admin and Partner

  try {
    await prisma.carnet.delete({
      where: { carn_id: carnetId },
    });

    revalidatePath('/dashboard/admin/carnets');
    return { success: true };
  } catch (error) {
    return { error: 'Errore durante l\'eliminazione del carnet' };
  }
}

export async function duplicateCarnet(carnetId: number) {
  await requireRole([0, 1]);  // Admin and Partner

  try {
    // Get the original carnet
    const original = await prisma.carnet.findUnique({
      where: { carn_id: carnetId },
    });

    if (!original) {
      return { error: 'Carnet non trovato' };
    }

    // Create duplicate with "Copia di " prefix
    await prisma.carnet.create({
      data: {
        carn_des: `Copia di ${original.carn_des || 'carnet'}`,
        carn_type: original.carn_type,
        carn_um: original.carn_um,
        carn_qta: original.carn_qta,
        carn_value: original.carn_value,
        carn_price: original.carn_price,
        carn_note: original.carn_note,
      },
    });

    revalidatePath('/dashboard/admin/carnets');
    return { success: true };
  } catch (error) {
    return { error: 'Errore durante la duplicazione del carnet' };
  }
}
