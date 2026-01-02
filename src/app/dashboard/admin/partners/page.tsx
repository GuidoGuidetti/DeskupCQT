import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { PlusCircleIcon, EditIcon, ImageIcon } from 'lucide-react';
import { DeletePartnerButton } from '@/components/delete-partner-button';

export default async function PartnersPage() {
  await requireRole([0]); // Admin only

  const partners = await prisma.partner.findMany({
    include: {
      _count: {
        select: {
          users: true,
          customers: true,
        },
      },
    },
    orderBy: {
      part_name: 'asc',
    },
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Partners</h2>
            <p className="text-gray-600 mt-1">Gestisci i partners del sistema</p>
          </div>
          <Link
            href="/dashboard/admin/partners/new"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Nuovo Partner
          </Link>
        </div>

        {partners.length === 0 ? (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-4">Nessun partner presente nel sistema.</p>
            <Link
              href="/dashboard/admin/partners/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Crea il primo partner
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Logo</th>
                  <th className="w-64 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="w-48 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="w-32 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Utenti</th>
                  <th className="w-32 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Clienti</th>
                  <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {partners.map((partner) => (
                  <tr key={partner.part_id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 text-sm text-gray-900">
                      #{partner.part_id}
                    </td>
                    <td className="px-4 py-4">
                      {partner.part_logo ? (
                        <img
                          src={partner.part_logo.startsWith('/') ? partner.part_logo : `/${partner.part_logo}`}
                          alt={partner.part_name || 'Logo'}
                          width={60}
                          height={40}
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-16 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <div className="truncate">{partner.part_name}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      <div className="truncate">{partner.part_email || '-'}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 text-center">
                      {partner._count.users}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 text-center">
                      {partner._count.customers}
                    </td>
                    <td className="px-3 py-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/dashboard/admin/partners/${partner.part_id}/edit`}
                          className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Modifica"
                        >
                          <EditIcon className="w-4 h-4" />
                        </Link>
                        <DeletePartnerButton partnerId={partner.part_id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
