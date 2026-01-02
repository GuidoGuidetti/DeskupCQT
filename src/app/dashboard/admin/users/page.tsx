import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { PlusCircleIcon } from 'lucide-react';
import { UsersTable } from '@/components/users-table';

export default async function UsersPage() {
  await requireRole([0]);

  const [users, partners, customers] = await Promise.all([
    prisma.user.findMany({
      include: {
        customer: true,
        partner: true,
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: {
        usr_id: 'asc',
      },
    }),
    prisma.partner.findMany({
      orderBy: { part_name: 'asc' },
    }),
    prisma.customer.findMany({
      orderBy: { cust_name: 'asc' },
    }),
  ]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestione Utenti</h2>
          <Link
            href="/dashboard/admin/users/new"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Nuovo Utente
          </Link>
        </div>

        <UsersTable users={users} partners={partners} customers={customers} />
      </div>
    </DashboardLayout>
  );
}
