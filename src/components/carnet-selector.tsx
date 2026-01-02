'use client';

import { translateUnitOfMeasure } from '@/lib/activity-calculations';

export interface CarnetInfo {
  cuscarn_id: number;
  carn_um: string;
  carn_price: number;
  carn_des: string;
  cuscarn_qtaini: number;
  cuscarn_qtaero: number;
}

interface CarnetSelectorProps {
  carnets: Array<{
    cuscarn_id: number;
    cuscarn_qtaini: number | null;
    cuscarn_qtaero: number | null;
    carnet: {
      carn_id: number;
      carn_des: string | null;
      carn_um: string | null;
      carn_price: number;
    } | null;
  }>;
  selectedCarnetId?: number;
  onCarnetChange: (carnetInfo: CarnetInfo | null) => void;
  disabled?: boolean;
}

export function CarnetSelector({
  carnets,
  selectedCarnetId,
  onCarnetChange,
  disabled = false,
}: CarnetSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const carnetId = parseInt(e.target.value);

    if (!carnetId || isNaN(carnetId)) {
      onCarnetChange(null);
      return;
    }

    const selectedCarnet = carnets.find(c => c.cuscarn_id === carnetId);

    if (selectedCarnet && selectedCarnet.carnet) {
      onCarnetChange({
        cuscarn_id: selectedCarnet.cuscarn_id,
        carn_um: selectedCarnet.carnet.carn_um || 'T',
        carn_price: Number(selectedCarnet.carnet.carn_price) || 0,
        carn_des: selectedCarnet.carnet.carn_des || '',
        cuscarn_qtaini: selectedCarnet.cuscarn_qtaini || 0,
        cuscarn_qtaero: selectedCarnet.cuscarn_qtaero || 0,
      });
    }
  };

  return (
    <div>
      <label htmlFor="carnet" className="block text-sm font-medium text-gray-700 mb-2">
        Carnet <span className="text-red-500">*</span>
      </label>
      <select
        id="carnet"
        name="carnet"
        required
        value={selectedCarnetId || ''}
        onChange={handleChange}
        disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">Seleziona un carnet...</option>
        {carnets.map((customerCarnet) => {
          if (!customerCarnet.carnet) return null;

          const { carnet, cuscarn_qtaero, cuscarn_qtaini } = customerCarnet;
          const umLabel = translateUnitOfMeasure(carnet.carn_um || '');
          const qtaIni = cuscarn_qtaini ?? 0;
          const qtaEro = cuscarn_qtaero ?? 0;
          const residuo = qtaIni - qtaEro;
          const price = Number(carnet.carn_price) || 0;
          const isLowStock = residuo <= 0;

          return (
            <option
              key={customerCarnet.cuscarn_id}
              value={customerCarnet.cuscarn_id}
              disabled={isLowStock}
              className={isLowStock ? 'text-red-500' : ''}
            >
              {carnet.carn_des} (UM: {umLabel}) - Residuo: {residuo} - Prezzo: €{price.toFixed(2)}
              {isLowStock ? ' [ESAURITO]' : ''}
            </option>
          );
        })}
      </select>
      {carnets.length === 0 && (
        <p className="mt-2 text-sm text-red-600">
          Nessun carnet attivo disponibile per questo cliente
        </p>
      )}
      {carnets.some(c => ((c.cuscarn_qtaini ?? 0) - (c.cuscarn_qtaero ?? 0)) <= 0) && (
        <p className="mt-2 text-sm text-amber-600">
          Alcuni carnet sono esauriti e non possono essere selezionati
        </p>
      )}
    </div>
  );
}
