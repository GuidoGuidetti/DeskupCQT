'use client';

import { useState, useEffect } from 'react';
import { updateCarnet } from '@/app/actions/carnets';
import Link from 'next/link';

interface CarnetEditFormProps {
  carnet: {
    carn_id: number;
    carn_des: string | null;
    carn_type: string | null;
    carn_um: string | null;
    carn_qta: number | null;
    carn_value: any;  // Decimal from Prisma
    carn_price: any;  // Decimal from Prisma
    carn_note: string | null;
  };
}

export function CarnetEditForm({ carnet }: CarnetEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [value, setValue] = useState<number>(carnet.carn_value ? Number(carnet.carn_value) : 0);
  const [quantity, setQuantity] = useState<number>(carnet.carn_qta || 0);
  const [price, setPrice] = useState<number>(carnet.carn_price ? Number(carnet.carn_price) : 0);
  const [priceOverridden, setPriceOverridden] = useState(false);

  // Auto-calcolo: price = value / quantity
  useEffect(() => {
    if (!priceOverridden && quantity > 0 && value > 0) {
      setPrice(Number((value / quantity).toFixed(2)));
    } else if (quantity === 0 && !priceOverridden) {
      setPrice(0);
    }
  }, [value, quantity, priceOverridden]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateCarnet(carnet.carn_id, formData);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
    // If successful, the server action will redirect automatically
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descrizione <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={3}
            defaultValue={carnet.carn_des || ''}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Descrizione del carnet"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              id="type"
              name="type"
              defaultValue={carnet.carn_type || 'C'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="C">C - Carnet</option>
              <option value="F">F - Consuntivo</option>
            </select>
          </div>

          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
              Unità di Misura
            </label>
            <select
              id="unit"
              name="unit"
              defaultValue={carnet.carn_um || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Seleziona...</option>
              <option value="G">G - Giornate</option>
              <option value="H">H - Ore</option>
              <option value="T">T - Tickets</option>
            </select>
          </div>

          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
              Valore Totale (€) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="value"
              name="value"
              required
              min="0"
              step="0.01"
              value={value || ''}
              onChange={(e) => {
                setValue(parseFloat(e.target.value) || 0);
                setPriceOverridden(false);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
              Quantità
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              min="0"
              value={quantity || ''}
              onChange={(e) => {
                setQuantity(parseInt(e.target.value) || 0);
                setPriceOverridden(false);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Prezzo (€)
            </label>
            <input
              type="number"
              id="price"
              name="price"
              min="0"
              step="0.01"
              value={price || ''}
              onChange={(e) => {
                setPrice(parseFloat(e.target.value) || 0);
                setPriceOverridden(true);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              {priceOverridden ? 'Prezzo personalizzato' : 'Calcolato automaticamente'}
            </p>
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
            defaultValue={carnet.carn_note || ''}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Note aggiuntive..."
          />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
          <Link
            href="/dashboard/admin/carnets"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annulla
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Aggiornamento...' : 'Aggiorna Carnet'}
          </button>
        </div>
      </div>
    </form>
  );
}
