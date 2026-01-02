import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export type SessionUser = {
  usr_id: number;
  usr_name: string;
  usr_mail: string;
  usr_role: number;
  usr_cust_id: number | null;
  usr_part_id: number | null;
  partner?: {
    part_name: string | null;
    part_data: string | null;
    part_logo: string | null;
  } | null;
};

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    return null;
  }

  try {
    const session: SessionUser = JSON.parse(sessionCookie.value);
    // Ensure usr_role is a number
    session.usr_role = Number(session.usr_role);
    return session;
  } catch {
    return null;
  }
}

export async function createSession(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set('session', JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireRole(allowedRoles: number[]) {
  const session = await requireAuth();

  // Ensure we're comparing numbers
  const userRole = Number(session.usr_role);

  // Admin (role 0) has access to everything
  if (userRole === 0) {
    return session;
  }

  // For other roles, check if they have permission
  if (!allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 1) {
      redirect('/dashboard/partner');
    } else if (userRole === 2) {
      redirect('/dashboard/user');
    } else {
      redirect('/login');
    }
  }
  return session;
}
