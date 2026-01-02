'use client';

import { useState, useMemo } from 'react';
import { Carnet } from '@prisma/client';
import Link from 'next/link';
import { EditIcon, ArrowUpDown } from 'lucide-react';
import { DeleteCarnetButton } from './delete-carnet-button';
import { DuplicateCarnetButton } from './duplicate-carnet-button';
import { deleteCarnet, duplicateCarnet } from '@/app/actions/carnets';

// Serialized carnet type with Decimal fields converted to number
type SerializedCarnet = Omit<Carnet, 'carn_value' | 'carn_price'> & {
  carn_value: number | null;
  carn_price: number | null;
};

interface CarnetsTableProps {
  carnets: SerializedCarnet[];
}

type SortField = 'carn_id' | 'carn_des' | 'carn_qta' | 'carn_value' | 'carn_price';

export function CarnetsTable({ carnets }: CarnetsTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterText, setFilterText] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterUnit, setFilterUnit] = useState<string>('all');

  // Sorting logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered and sorted data
  const filteredAndSortedCarnets = useMemo(() => {
    let filtered = [...carnets];

    // Text filter (search in description)
    if (filterText) {
      filtered = filtered.filter(c =>
        c.carn_des?.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(c => c.carn_type === filterType);
    }

    // Unit filter
    if (filterUnit !== 'all') {
      filtered = filtered.filter(c => c.carn_um === filterUnit);
    }

    // Sorting
    if (sortField) {
      filtered.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        // Handle Decimal type from Prisma
        const aNum = typeof aVal === 'number' ? aVal : Number(aVal);
        const bNum = typeof bVal === 'number' ? bVal : Number(bVal);

        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      });
    }

    return filtered;
  }, [carnets, sortField, sortDirection, filterText, filterType, filterUnit]);

  const getUnitLabel = (um: string | null) => {
    switch (um) {
      case 'G': return 'Giornate';
      case 'H': return 'Ore';
      case 'T': return 'Tickets';
      default: return '-';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cerca
            </label>
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Cerca nella descrizione..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="all">Tutti</option>
              <option value="C">Carnet</option>
              <option value="F">Consuntivo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unità
            </label>
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="all">Tutte</option>
              <option value="G">Giornate</option>
              <option value="H">Ore</option>
              <option value="T">Tickets</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterText('');
                setFilterType('all');
                setFilterUnit('all');
                setSortField(null);
              }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset Filtri
            </button>
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-600">
          Trovati {filteredAndSortedCarnets.length} di {carnets.length} carnets
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort('carn_id')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  ID <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('carn_des')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  Descrizione <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unità</th>
              <th
                onClick={() => handleSort('carn_qta')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  Quantità <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('carn_value')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  Valore <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('carn_price')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  Prezzo <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Azioni</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedCarnets.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  Nessun carnet trovato con i filtri selezionati
                </td>
              </tr>
            ) : (
              filteredAndSortedCarnets.map((carnet) => (
                <tr key={carnet.carn_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{carnet.carn_id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{carnet.carn_des}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {getUnitLabel(carnet.carn_um)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{carnet.carn_qta || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {carnet.carn_value ? `€ ${Number(carnet.carn_value).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {carnet.carn_price ? `€ ${Number(carnet.carn_price).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{carnet.carn_note || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center justify-center gap-1">
                      <DuplicateCarnetButton carnetId={carnet.carn_id} duplicateAction={duplicateCarnet} />
                      <Link
                        href={`/dashboard/admin/carnets/${carnet.carn_id}/edit`}
                        className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                        title="Modifica"
                      >
                        <EditIcon className="w-5 h-5" />
                      </Link>
                      <DeleteCarnetButton carnetId={carnet.carn_id} deleteAction={deleteCarnet} />
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
