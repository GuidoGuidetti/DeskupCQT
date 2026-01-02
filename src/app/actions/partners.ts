'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function createPartner(formData: FormData) {
  const session = await getSession();

  if (!session || session.usr_role !== 0) {
    return { error: 'Non autorizzato' };
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const data = formData.get('data') as string;
  const logoFile = formData.get('logo') as File | null;

  if (!name || name.trim().length === 0) {
    return { error: 'Il nome è obbligatorio' };
  }

  try {
    let logoPath = null;

    // Handle logo upload if provided
    if (logoFile && logoFile.size > 0) {
      // Check file size (max 5MB)
      if (logoFile.size > 5 * 1024 * 1024) {
        return { error: 'Il logo non può superare i 5MB' };
      }

      // Check file type
      if (!logoFile.type.startsWith('image/')) {
        return { error: 'Il logo deve essere un\'immagine' };
      }

      const uploadDir = join(process.cwd(), 'public', 'uploads', 'partners');
      await mkdir(uploadDir, { recursive: true });

      const bytes = await logoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const timestamp = Date.now();
      const sanitizedName = logoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}_${sanitizedName}`;
      const filepath = join(uploadDir, filename);

      await writeFile(filepath, buffer);
      logoPath = `/uploads/partners/${filename}`;
    }

    await prisma.partner.create({
      data: {
        part_name: name.trim(),
        part_email: email?.trim() || null,
        part_data: data?.trim() || null,
        part_logo: logoPath,
      },
    });

    revalidatePath('/dashboard/admin/partners');
    redirect('/dashboard/admin/partners');
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT' || error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Error creating partner:', error);
    return { error: 'Errore durante la creazione del partner' };
  }
}

export async function updatePartner(partnerId: number, formData: FormData) {
  const session = await getSession();

  if (!session || session.usr_role !== 0) {
    return { error: 'Non autorizzato' };
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const data = formData.get('data') as string;
  const logoFile = formData.get('logo') as File | null;

  if (!name || name.trim().length === 0) {
    return { error: 'Il nome è obbligatorio' };
  }

  try {
    const partner = await prisma.partner.findUnique({
      where: { part_id: partnerId },
    });

    if (!partner) {
      return { error: 'Partner non trovato' };
    }

    let logoPath = partner.part_logo;

    // Handle logo upload if provided
    if (logoFile && logoFile.size > 0) {
      if (logoFile.size > 5 * 1024 * 1024) {
        return { error: 'Il logo non può superare i 5MB' };
      }

      if (!logoFile.type.startsWith('image/')) {
        return { error: 'Il logo deve essere un\'immagine' };
      }

      const uploadDir = join(process.cwd(), 'public', 'uploads', 'partners');
      await mkdir(uploadDir, { recursive: true });

      const bytes = await logoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const timestamp = Date.now();
      const sanitizedName = logoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}_${sanitizedName}`;
      const filepath = join(uploadDir, filename);

      await writeFile(filepath, buffer);
      logoPath = `/uploads/partners/${filename}`;
    }

    await prisma.partner.update({
      where: { part_id: partnerId },
      data: {
        part_name: name.trim(),
        part_email: email?.trim() || null,
        part_data: data?.trim() || null,
        part_logo: logoPath,
      },
    });

    revalidatePath('/dashboard/admin/partners');
    revalidatePath(`/dashboard/admin/partners/${partnerId}/edit`);
    redirect('/dashboard/admin/partners');
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT' || error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Error updating partner:', error);
    return { error: 'Errore durante l\'aggiornamento del partner' };
  }
}

export async function deletePartner(partnerId: number) {
  const session = await getSession();

  if (!session || session.usr_role !== 0) {
    return { error: 'Non autorizzato' };
  }

  try {
    const partner = await prisma.partner.findUnique({
      where: { part_id: partnerId },
      include: {
        users: true,
        customers: true,
      },
    });

    if (!partner) {
      return { error: 'Partner non trovato' };
    }

    // Check if partner has users or customers
    if (partner.users.length > 0 || partner.customers.length > 0) {
      return { error: 'Impossibile eliminare: il partner ha utenti o clienti associati' };
    }

    await prisma.partner.delete({
      where: { part_id: partnerId },
    });

    revalidatePath('/dashboard/admin/partners');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting partner:', error);
    return { error: 'Errore durante l\'eliminazione del partner' };
  }
}
