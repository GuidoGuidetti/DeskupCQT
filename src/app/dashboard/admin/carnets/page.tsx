import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { PlusCircleIcon } from 'lucide-react';
import { CarnetsTable } from '@/components/carnets-table';

export default async function CarnetsPage() {
  await requireRole([0, 1]);  // Admin and Partner

  const carnets = await prisma.carnet.findMany({
    orderBy: {
      carn_id: 'asc',
    },
  });

  // Convert Decimal to number for client component serialization
  const serializedCarnets = carnets.map(carnet => ({
    ...carnet,
    carn_value: carnet.carn_value ? Number(carnet.carn_value) : null,
    carn_price: carnet.carn_price ? Number(carnet.carn_price) : null,
  }));

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestione Carnets</h2>
          <Link
            href="/dashboard/admin/carnets/new"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Nuovo Carnet
          </Link>
        </div>

        {serializedCarnets.length === 0 ? (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Nessun carnet presente nel database.</p>
          </div>
        ) : (
          <CarnetsTable carnets={serializedCarnets} />
        )}
      </div>
    </DashboardLayout>
  );
}
