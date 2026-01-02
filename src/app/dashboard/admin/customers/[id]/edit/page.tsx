import { requireRole, getSession } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { updateCustomer } from '@/app/actions/customers';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole([0, 1]);  // Admin and Partner

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

  // Get all partners for the dropdown
  const partners = await prisma.partner.findMany({
    orderBy: { part_name: 'asc' },
  });

  // Create a bound version of updateCustomer with the customer ID
  const updateCustomerWithId = updateCustomer.bind(null, customerId);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Modifica Cliente</h2>
          <p className="text-gray-600 mt-1">Aggiorna i dati del cliente</p>
        </div>

        <form action={async (formData) => { await updateCustomerWithId(formData); }} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome Cliente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                defaultValue={customer.cust_name || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Nome o Ragione Sociale"
              />
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Codice Cliente
              </label>
              <input
                type="text"
                id="code"
                name="code"
                maxLength={50}
                defaultValue={customer.cust_code || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Codice univoco cliente"
              />
            </div>

            <div>
              <label htmlFor="partner" className="block text-sm font-medium text-gray-700 mb-2">
                Partner
              </label>
              <select
                id="partner"
                name="partner"
                defaultValue={customer.cust_part_id?.toString() || ''}
                disabled={session.usr_role === 1}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Nessun partner</option>
                {partners.map((partner) => (
                  <option key={partner.part_id} value={partner.part_id}>
                    {partner.part_name}
                  </option>
                ))}
              </select>
              {session.usr_role === 1 && (
                <p className="text-xs text-gray-500 mt-1">
                  Il partner non può essere modificato
                </p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Indirizzo
              </label>
              <input
                type="text"
                id="address"
                name="address"
                defaultValue={customer.cust_address || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Via, numero civico"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  Città
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  defaultValue={customer.cust_city || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Città"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  Provincia/Stato
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  maxLength={20}
                  defaultValue={customer.cust_state || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="es. MI, RM"
                />
              </div>
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Paese
              </label>
              <input
                type="text"
                id="country"
                name="country"
                defaultValue={customer.cust_country || 'ITALY'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="ITALY"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              <Link
                href="/dashboard/admin/customers"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annulla
              </Link>
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
              >
                Salva Modifiche
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
