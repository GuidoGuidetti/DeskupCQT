'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FileSpreadsheet } from 'lucide-react';
import { exportActivitiesToExcel } from '@/app/actions/activities';
import {
  getUnitBadgeColor,
  translateUnitOfMeasure,
  getStatusBadgeColor,
  translateTicketStatus,
  translateCarnetType
} from '@/lib/activity-calculations';

type ActivityWithRelations = {
  act_id: number;
  act_tick_id: number;
  act_date: Date;
  act_unit_qta: number;
  act_value: number;
  ticket: {
    tick_id: number;
    tick_title: string;
    tick_status: string;
    tick_usr_id: number;
    user: {
      usr_id: number;
      usr_name: string | null;
    };
  };
  customer: {
    cust_id: number;
    cust_name: string | null;
  };
  customerCarnet: {
    carnet: {
      carn_um: string | null;
      carn_type: string | null;
    } | null;
  };
};

interface ActivitiesTableProps {
  activities: ActivityWithRelations[];
  users: Array<{ usr_id: number; usr_name: string | null }>;
  customers: Array<{ cust_id: number; cust_name: string | null }>;
}

export function ActivitiesTable({ activities, users, customers }: ActivitiesTableProps) {
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterCustomer, setFilterCustomer] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Filtered activities using useMemo
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      // User filter
      if (filterUser !== 'all' && activity.ticket.tick_usr_id !== parseInt(filterUser)) {
        return false;
      }
      // Customer filter
      if (filterCustomer !== 'all' && activity.customer.cust_id !== parseInt(filterCustomer)) {
        return false;
      }
      // Status filter
      if (filterStatus !== 'all' && activity.ticket.tick_status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [activities, filterUser, filterCustomer, filterStatus]);

  // Handle Excel export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const formData = new FormData();
      formData.append('filterUser', filterUser);
      formData.append('filterCustomer', filterCustomer);
      formData.append('filterStatus', filterStatus);

      const result = await exportActivitiesToExcel(formData);

      if (result.success && result.fileUrl) {
        // Trigger download
        const link = document.createElement('a');
        link.href = result.fileUrl;
        link.download = result.filename || 'activities.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Errore durante l\'esportazione');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Export Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Filtri</h2>
        <button
          onClick={handleExport}
          disabled={isExporting}
          title="Esporta in Excel"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span className="hidden sm:inline">{isExporting ? 'Esportando...' : 'Esporta Excel'}</span>
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* User Filter */}
          <div>
            <label htmlFor="filterUser" className="block text-sm font-medium text-gray-700 mb-1">
              User
            </label>
            <select
              id="filterUser"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Tutti</option>
              {users.map(user => (
                <option key={user.usr_id} value={user.usr_id}>
                  {user.usr_name || `User #${user.usr_id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div>
            <label htmlFor="filterCustomer" className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <select
              id="filterCustomer"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Tutti</option>
              {customers.map(customer => (
                <option key={customer.cust_id} value={customer.cust_id}>
                  {customer.cust_name || `Cliente #${customer.cust_id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700 mb-1">
              Stato
            </label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Tutti</option>
              <option value="open">Aperto</option>
              <option value="in_progress">In Lavorazione</option>
              <option value="waiting">In Attesa</option>
              <option value="closed">Chiuso</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="mt-3 text-sm text-gray-600">
          Trovate <strong>{filteredActivities.length}</strong> attività
          {filteredActivities.length !== activities.length && (
            <span> di {activities.length} totali</span>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Ticket
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titolo Ticket
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UM
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo Carnet
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qtà
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valore
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    Nessuna attività trovata
                  </td>
                </tr>
              ) : (
                filteredActivities.map(activity => (
                  <tr key={activity.act_id} className="hover:bg-gray-50">
                    {/* Data */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {new Date(activity.act_date).toLocaleDateString('it-IT')}
                    </td>

                    {/* Nome Cliente */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {activity.customer.cust_name || '-'}
                    </td>

                    {/* Nome User */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {activity.ticket.user.usr_name || '-'}
                    </td>

                    {/* ID Ticket (with link) */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <Link
                        href={`/dashboard/admin/tickets/${activity.act_tick_id}/activities`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        #{activity.act_tick_id}
                      </Link>
                    </td>

                    {/* Titolo Ticket (truncated with tooltip) */}
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                      <div
                        className="truncate"
                        title={activity.ticket.tick_title}
                      >
                        {activity.ticket.tick_title}
                      </div>
                    </td>

                    {/* UM (with badge) */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getUnitBadgeColor(activity.customerCarnet.carnet?.carn_um || 'T')}`}>
                        {translateUnitOfMeasure(activity.customerCarnet.carnet?.carn_um || 'T')}
                      </span>
                    </td>

                    {/* Tipo Carnet */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {translateCarnetType(activity.customerCarnet.carnet?.carn_type || 'C')}
                    </td>

                    {/* Qtà */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {activity.act_unit_qta.toFixed(2)}
                    </td>

                    {/* Valore */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      € {activity.act_value.toFixed(2)}
                    </td>

                    {/* Stato (with badge) */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeColor(activity.ticket.tick_status)}`}>
                        {translateTicketStatus(activity.ticket.tick_status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
