import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { updateUser } from '@/app/actions/users';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole([0]);

  const userId = parseInt((await params).id);

  if (isNaN(userId)) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { usr_id: userId },
  });

  if (!user) {
    notFound();
  }

  const customers = await prisma.customer.findMany({
    orderBy: { cust_name: 'asc' },
  });

  const partners = await prisma.partner.findMany({
    orderBy: { part_name: 'asc' },
  });

  async function handleUpdateUser(formData: FormData) {
    'use server';
    await updateUser(userId, formData);
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Modifica Utente</h2>
          <p className="text-gray-600 mt-1">Aggiorna i dati dell&apos;utente</p>
        </div>

        <form action={handleUpdateUser} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  defaultValue={user.usr_name || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  defaultValue={user.usr_mail || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="email@esempio.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Lascia vuoto per non modificare"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lascia vuoto per mantenere la password attuale
                </p>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Ruolo <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  defaultValue={user.usr_role?.toString() || '2'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="2">Utente</option>
                  <option value="1">Partner</option>
                  <option value="0">Amministratore</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente Associato
                </label>
                <select
                  id="customer_id"
                  name="customer_id"
                  defaultValue={user.usr_cust_id?.toString() || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="">Nessun cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.cust_id} value={customer.cust_id}>
                      {customer.cust_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="partner_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Partner Associato
                </label>
                <select
                  id="partner_id"
                  name="partner_id"
                  defaultValue={user.usr_part_id?.toString() || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="">Nessun partner</option>
                  {partners.map((partner) => (
                    <option key={partner.part_id} value={partner.part_id}>
                      {partner.part_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                Note
              </label>
              <textarea
                id="note"
                name="note"
                rows={3}
                defaultValue={user.usr_note || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Note aggiuntive..."
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              <Link
                href="/dashboard/admin/users"
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
