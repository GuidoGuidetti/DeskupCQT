import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { updateCustomerCarnet } from '@/app/actions/customer-carnets';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditCustomerCarnetPage({
  params,
}: {
  params: { id: string; carnetId: string };
}) {
  await requireRole([0, 1]);  // Admin and Partner

  const customerId = parseInt((await params).id);
  const customerCarnetId = parseInt((await params).carnetId);

  if (isNaN(customerId) || isNaN(customerCarnetId)) {
    notFound();
  }

  const customer = await prisma.customer.findUnique({
    where: { cust_id: customerId },
  });

  if (!customer) {
    notFound();
  }

  const customerCarnet = await prisma.customerCarnet.findUnique({
    where: { cuscarn_id: customerCarnetId },
    include: {
      carnet: true,
    },
  });

  if (!customerCarnet) {
    notFound();
  }

  const carnets = await prisma.carnet.findMany({
    orderBy: { carn_des: 'asc' },
  });

  // Create a bound version with IDs
  const updateCustomerCarnetWithId = updateCustomerCarnet.bind(null, customerCarnetId, customerId);

  // Format dates for input fields
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Translate unit of measure
  const translateUM = (um: string | null) => {
    switch (um) {
      case 'G': return 'Giornate';
      case 'H': return 'Ore';
      case 'T': return 'Tickets';
      default: return um || '-';
    }
  };

  // Translate carnet type
  const translateType = (type: string | null) => {
    switch (type) {
      case 'C': return 'Carnet';
      case 'F': return 'Consuntivo';
      default: return type || '-';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Modifica Carnet di {customer.cust_name}</h2>
          <p className="text-gray-600 mt-1">Aggiorna i dati del carnet assegnato</p>
        </div>

        <form action={updateCustomerCarnetWithId} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="carnet_id" className="block text-sm font-medium text-gray-700 mb-2">
                Carnet <span className="text-red-500">*</span>
              </label>
              <select
                id="carnet_id"
                name="carnet_id"
                required
                defaultValue={customerCarnet.cuscarn_carn_id?.toString() || ''}
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
                Cambiando carnet, la quantità iniziale verrà aggiornata automaticamente
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Informazioni Carnet Attuale</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Descrizione:</span>
                  <p className="text-blue-900">{customerCarnet.carnet?.carn_des || '-'}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Tipo:</span>
                  <p className="text-blue-900">{translateType(customerCarnet.carnet?.carn_type)}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Unità di Misura:</span>
                  <p className="text-blue-900">{translateUM(customerCarnet.carnet?.carn_um)}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Prezzo:</span>
                  <p className="text-blue-900">
                    {customerCarnet.carnet?.carn_price ? `€ ${Number(customerCarnet.carnet.carn_price).toFixed(2)}` : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Quantità Iniziale:</span>
                  <p className="text-blue-900">{customerCarnet.cuscarn_qtaini || 0}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Quantità Residua:</span>
                  <p className="text-blue-900 font-semibold">
                    {(customerCarnet.cuscarn_qtaini || 0) - (customerCarnet.cuscarn_qtaero || 0)}
                  </p>
                </div>
              </div>
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
                  defaultValue={formatDate(customerCarnet.cuscarn_datestart)}
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
                  defaultValue={formatDate(customerCarnet.cuscarn_dateend)}
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
                defaultValue={customerCarnet.cuscarn_qtaero || 0}
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
                defaultValue={customerCarnet.cuscarn_note || ''}
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
                defaultChecked={customerCarnet.cuscarn_active || false}
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
                Salva Modifiche
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
