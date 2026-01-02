import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { createCustomerCarnet } from '@/app/actions/customer-carnets';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function NewCustomerCarnetPage({ params }: { params: { id: string } }) {
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

  const carnets = await prisma.carnet.findMany({
    orderBy: { carn_des: 'asc' },
  });

  // Create a bound version with customerId
  const createCustomerCarnetWithId = createCustomerCarnet.bind(null, customerId);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Aggiungi Carnet a {customer.cust_name}</h2>
          <p className="text-gray-600 mt-1">Assegna un nuovo carnet al cliente</p>
        </div>

        <form action={createCustomerCarnetWithId} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="carnet_id" className="block text-sm font-medium text-gray-700 mb-2">
                Carnet <span className="text-red-500">*</span>
              </label>
              <select
                id="carnet_id"
                name="carnet_id"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">Seleziona un carnet</option>
                {carnets.map((carnet) => (
                  <option key={carnet.carn_id} value={carnet.carn_id}>
                    {carnet.carn_des} ({carnet.carn_um}) - Qta: {carnet.carn_qta}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                La quantità iniziale verrà impostata automaticamente dal carnet selezionato
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date_start" className="block text-sm font-medium text-gray-700 mb-2">
                  Data Inizio
                </label>
                <input
                  type="date"
                  id="date_start"
                  name="date_start"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="date_end" className="block text-sm font-medium text-gray-700 mb-2">
                  Data Scadenza
                </label>
                <input
                  type="date"
                  id="date_end"
                  name="date_end"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="qta_ero" className="block text-sm font-medium text-gray-700 mb-2">
                Quantità Erogata
              </label>
              <input
                type="number"
                id="qta_ero"
                name="qta_ero"
                defaultValue="0"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Quantità già utilizzata"
              />
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                Note
              </label>
              <textarea
                id="note"
                name="note"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Note aggiuntive..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                name="active"
                value="true"
                defaultChecked
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                Attivo
              </label>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              <Link
                href={`/dashboard/admin/customers/${customerId}/carnets`}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annulla
              </Link>
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
              >
                Crea Carnet
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
