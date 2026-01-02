import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { PlusCircleIcon, ArrowLeftIcon } from 'lucide-react';
import { CustomerCarnetActions } from '@/components/customer-carnet-actions';
import { notFound } from 'next/navigation';

export default async function CustomerCarnetsPage({ params }: { params: { id: string } }) {
  await requireRole([0, 1]);  // Admin and Partner

  const customerId = parseInt((await params).id);

  if (isNaN(customerId)) {
    notFound();
  }

  const customer = await prisma.customer.findUnique({
    where: { cust_id: customerId },
  });

  if (!customer) {
    notFound();
  }

  const customerCarnets = await prisma.customerCarnet.findMany({
    where: { cuscarn_cust_id: customerId },
    include: {
      carnet: true,
    },
    orderBy: {
      cuscarn_id: 'desc',
    },
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/admin/customers"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Torna ai clienti
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Carnets di {customer.cust_name}</h2>
              <p className="text-gray-600 mt-1">Gestisci i carnets acquistati dal cliente</p>
            </div>
            <Link
              href={`/dashboard/admin/customers/${customerId}/carnets/new`}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Nuovo Carnet
            </Link>
          </div>
        </div>

        {customerCarnets.length === 0 ? (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Nessun carnet presente per questo cliente.</p>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carnet</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">U.M.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qta Iniziale</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qta Erogata</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qta Residua</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Inizio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Fine</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attivo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customerCarnets.map((cc) => {
                  const qtaResidua = (cc.cuscarn_qtaini || 0) - (cc.cuscarn_qtaero || 0);
                  return (
                    <tr key={cc.cuscarn_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cc.cuscarn_id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {cc.carnet?.carn_des || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {cc.carnet?.carn_um || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {cc.cuscarn_qtaini || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {cc.cuscarn_qtaero || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {qtaResidua}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {cc.cuscarn_datestart ? new Date(cc.cuscarn_datestart).toLocaleDateString('it-IT') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {cc.cuscarn_dateend ? new Date(cc.cuscarn_dateend).toLocaleDateString('it-IT') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            cc.cuscarn_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {cc.cuscarn_active ? 'Sì' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <CustomerCarnetActions
                          customerCarnetId={cc.cuscarn_id}
                          customerId={customerId}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
