'use server';

import { prisma } from '@/lib/prisma';
import { createSession, deleteSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email e password sono obbligatori' };
  }

  // Find user by email with partner data
  const user = await prisma.user.findFirst({
    where: {
      usr_mail: email,
    },
    include: {
      partner: true,
    },
  });

  if (!user) {
    return { error: 'Credenziali non valide' };
  }

  // Check password (plain text comparison - in production use bcrypt!)
  if (user.usr_pwd !== password) {
    return { error: 'Credenziali non valide' };
  }

  // Create session with partner data if applicable
  await createSession({
    usr_id: user.usr_id,
    usr_name: user.usr_name || '',
    usr_mail: user.usr_mail || '',
    usr_role: user.usr_role ?? 2,  // Use ?? instead of || to preserve 0
    usr_cust_id: user.usr_cust_id,
    usr_part_id: user.usr_part_id,
    partner: user.partner ? {
      part_name: user.partner.part_name,
      part_data: user.partner.part_data,
      part_logo: user.partner.part_logo,
    } : null,
  });

  // Redirect based on role
  if (user.usr_role === 0) {
    redirect('/dashboard/admin');
  } else if (user.usr_role === 1) {
    redirect('/dashboard/partner');
  } else {
    redirect('/dashboard/user');
  }
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}
