import { requireRole, getSession } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { PlusCircleIcon } from 'lucide-react';
import { CustomersTable } from '@/components/customers-table';

export default async function CustomersPage() {
  const session = await requireRole([0, 1]);  // Admin and Partner

  // Filter customers based on user role
  // If usr_role = 1 (Partner), show only customers with matching cust_part_id
  const [customers, partners] = await Promise.all([
    prisma.customer.findMany({
      where: session.usr_role === 1 ? {
        cust_part_id: session.usr_part_id,
      } : {},
      include: {
        partner: true,
        _count: {
          select: { users: true, tickets: true },
        },
      },
      orderBy: {
        cust_id: 'asc',
      },
    }),
    prisma.partner.findMany({
      orderBy: { part_name: 'asc' },
    }),
  ]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestione Clienti</h2>
          <Link
            href="/dashboard/admin/customers/new"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Nuovo Cliente
          </Link>
        </div>

        <CustomersTable customers={customers} partners={partners} />
      </div>
    </DashboardLayout>
  );
}
