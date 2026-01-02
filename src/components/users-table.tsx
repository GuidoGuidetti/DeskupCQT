'use client';

import { useState, useMemo } from 'react';
import { User, Customer, Partner } from '@prisma/client';
import { UserActions } from './user-actions';

type UserWithRelations = User & {
  customer: Customer | null;
  partner: Partner | null;
  _count: { tickets: number };
};

interface UsersTableProps {
  users: UserWithRelations[];
  partners: Partner[];
  customers: Customer[];
}

export function UsersTable({ users, partners, customers }: UsersTableProps) {
  const [filterPartner, setFilterPartner] = useState<string>('all');
  const [filterCustomer, setFilterCustomer] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');

  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Filter by partner
    if (filterPartner !== 'all') {
      filtered = filtered.filter(u =>
        u.usr_part_id === parseInt(filterPartner)
      );
    }

    // Filter by customer
    if (filterCustomer !== 'all') {
      filtered = filtered.filter(u =>
        u.usr_cust_id === parseInt(filterCustomer)
      );
    }

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter(u =>
        u.usr_role === parseInt(filterRole)
      );
    }

    return filtered;
  }, [users, filterPartner, filterCustomer, filterRole]);

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente
            </label>
            <select
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="all">Tutti</option>
              {customers.map((customer) => (
                <option key={customer.cust_id} value={customer.cust_id}>
                  {customer.cust_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ruolo
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="all">Tutti</option>
              <option value="0">Admin</option>
              <option value="1">Partner</option>
              <option value="2">Utente</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterPartner('all');
                setFilterCustomer('all');
                setFilterRole('all');
              }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset Filtri
            </button>
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-600">
          Trovati {filteredUsers.length} di {users.length} utenti
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="w-48 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="w-56 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruolo</th>
              <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
              <th className="w-20 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tickets</th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azioni</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  Nessun utente trovato con i filtri selezionati
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.usr_id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 text-sm text-gray-900">
                    #{user.usr_id}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    <div className="truncate">{user.usr_name}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    <div className="truncate">{user.usr_mail}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.usr_role === 0
                          ? 'bg-red-100 text-red-800'
                          : user.usr_role === 1
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.usr_role === 0 ? 'Admin' : user.usr_role === 1 ? 'Partner' : 'Utente'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    <div className="truncate">{user.customer?.cust_name || '-'}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    <div className="truncate">{user.partner?.part_name || '-'}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 text-center">
                    {user._count.tickets}
                  </td>
                  <td className="px-3 py-4 text-sm">
                    <UserActions userId={user.usr_id} ticketCount={user._count.tickets} />
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
