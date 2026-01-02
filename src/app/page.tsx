import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Redirect to appropriate dashboard based on role
  if (session.usr_role === 0) {
    redirect('/dashboard/admin');
  } else if (session.usr_role === 1) {
    redirect('/dashboard/partner');
  } else {
    redirect('/dashboard/user');
  }
}
