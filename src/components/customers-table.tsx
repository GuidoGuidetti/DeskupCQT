'use client';

import { useState, useMemo } from 'react';
import { Customer, Partner } from '@prisma/client';
import Link from 'next/link';
import { PackageIcon } from 'lucide-react';
import { CustomerActions } from './customer-actions';

type CustomerWithRelations = Customer & {
  partner: Partner | null;
  _count: { users: number; tickets: number };
};

interface CustomersTableProps {
  customers: CustomerWithRelations[];
  partners: Partner[];
}

export function CustomersTable({ customers, partners }: CustomersTableProps) {
  const [filterPartner, setFilterPartner] = useState<string>('all');

  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];

    // Filter by partner
    if (filterPartner !== 'all') {
      filtered = filtered.filter(c =>
        c.cust_part_id === parseInt(filterPartner)
      );
    }

    return filtered;
  }, [customers, filterPartner]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Partner
            </label>
            <select
              value={filterPartner}
              onChange={(e) => setFilterPartner(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="all">Tutti</option>
              {partners.map((partner) => (
                <option key={partner.part_id} value={partner.part_id}>
                  {partner.part_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilterPartner('all')}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset Filtri
            </button>
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-600">
          Trovati {filteredCustomers.length} di {customers.length} clienti
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="w-56 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Codice</th>
              <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
              <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Città</th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paese</th>
              <th className="w-20 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Utenti</th>
              <th className="w-20 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tickets</th>
              <th className="w-28 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azioni</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                  Nessun cliente trovato con i filtri selezionati
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.cust_id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 text-sm text-gray-900">#{customer.cust_id}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    <div className="truncate">{customer.cust_name}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    <div className="truncate">{customer.cust_code || '-'}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    <div className="truncate">{customer.partner?.part_name || '-'}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    <div className="truncate">{customer.cust_city || '-'}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    <div className="truncate">{customer.cust_country || '-'}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 text-center">
                    {customer._count.users}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 text-center">
                    {customer._count.tickets}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/dashboard/admin/customers/${customer.cust_id}/carnets`}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Gestisci carnets"
                      >
                        <PackageIcon className="w-4 h-4" />
                      </Link>
                      <CustomerActions customerId={customer.cust_id} ticketCount={customer._count.tickets} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
