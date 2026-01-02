'use client';

import { useState, useEffect } from 'react';
import { CarnetSelector, CarnetInfo } from './carnet-selector';
import {
  calculateTimeDifference,
  minutesToFormatted,
  formattedToMinutes,
  calculateUnitQuantity,
  calculateValue,
  translateUnitOfMeasure,
} from '@/lib/activity-calculations';

interface ActivityFormProps {
  ticketId: number;
  customerId: number;
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
  onSubmit: (formData: FormData, sendEmail: boolean) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ActivityForm({
  ticketId,
  customerId,
  carnets,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ActivityFormProps) {
  // Form state
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [timeWorked, setTimeWorked] = useState<string>('00:00');
  const [selectedCarnet, setSelectedCarnet] = useState<CarnetInfo | null>(null);
  const [sendEmail, setSendEmail] = useState<boolean>(true);

  // Calculated values
  const [unitQuantity, setUnitQuantity] = useState<number>(0);
  const [totalValue, setTotalValue] = useState<number>(0);

  // Auto-calculate time worked when start/end times change
  useEffect(() => {
    if (startTime && endTime) {
      try {
        const minutes = calculateTimeDifference(startTime, endTime);
        setTimeWorked(minutesToFormatted(minutes));
      } catch (error) {
        console.error('Error calculating time:', error);
      }
    }
  }, [startTime, endTime]);

  // Auto-calculate unit quantity and value when time or carnet changes
  useEffect(() => {
    if (selectedCarnet && timeWorked) {
      try {
        const minutes = formattedToMinutes(timeWorked);
        const quantity = calculateUnitQuantity(minutes, selectedCarnet.carn_um);
        const value = calculateValue(selectedCarnet.carn_price, quantity);

        setUnitQuantity(quantity);
        setTotalValue(value);
      } catch (error) {
        console.error('Error calculating values:', error);
        setUnitQuantity(0);
        setTotalValue(0);
      }
    } else {
      setUnitQuantity(0);
      setTotalValue(0);
    }
  }, [timeWorked, selectedCarnet]);

  // Handle manual time edit
  const handleTimeWorkedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeWorked(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Add calculated values to formData
    formData.set('act_time', formattedToMinutes(timeWorked).toString());
    formData.set('act_unit_qta', unitQuantity.toString());
    formData.set('act_value', totalValue.toString());

    await onSubmit(formData, sendEmail);
  };

  // Set default times and auto-select first carnet
  useEffect(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setStartTime(currentTime);
    setEndTime(currentTime);

    // Auto-select first selectable carnet
    if (carnets.length > 0 && !selectedCarnet) {
      // Find first carnet that is not exhausted (residuo > 0)
      const firstSelectableCarnet = carnets.find(c => {
        const qtaIni = c.cuscarn_qtaini ?? 0;
        const qtaEro = c.cuscarn_qtaero ?? 0;
        const residuo = qtaIni - qtaEro;
        return residuo > 0 || c.carnet?.carn_um === 'F'; // Also select Consuntivo type
      });

      if (firstSelectableCarnet && firstSelectableCarnet.carnet) {
        setSelectedCarnet({
          cuscarn_id: firstSelectableCarnet.cuscarn_id,
          carn_um: firstSelectableCarnet.carnet.carn_um || 'T',
          carn_price: firstSelectableCarnet.carnet.carn_price,
          carn_des: firstSelectableCarnet.carnet.carn_des || '',
          cuscarn_qtaini: firstSelectableCarnet.cuscarn_qtaini ?? 0,
          cuscarn_qtaero: firstSelectableCarnet.cuscarn_qtaero ?? 0,
        });
      }
    }
  }, [carnets, selectedCarnet]);

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      <div className="space-y-6">
        {/* Hidden fields for ticket and customer IDs */}
        <input type="hidden" name="act_tick_id" value={ticketId} />
        <input type="hidden" name="act_cust_id" value={customerId} />

        {/* Description */}
        <div>
          <label htmlFor="act_description" className="block text-sm font-medium text-gray-700 mb-2">
            Descrizione Attività <span className="text-red-500">*</span>
          </label>
          <textarea
            id="act_description"
            name="act_description"
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Descrivi l'attività svolta..."
          />
        </div>

        {/* Response */}
        <div>
          <label htmlFor="act_response" className="block text-sm font-medium text-gray-700 mb-2">
            Risposta all&apos;Utente
          </label>
          <textarea
            id="act_response"
            name="act_response"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Se vuoto, verrà utilizzata la descrizione dell&apos;attività"
          />
          <p className="mt-1 text-xs text-gray-500">
            Questo testo sarà inviato via email all&apos;utente che ha creato il ticket
          </p>
        </div>

        {/* Date */}
        <div>
          <label htmlFor="act_date" className="block text-sm font-medium text-gray-700 mb-2">
            Data Attività <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="act_date"
            name="act_date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        {/* Time fields grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Start Time */}
          <div>
            <label htmlFor="act_start_time" className="block text-sm font-medium text-gray-700 mb-2">
              Ora Inizio <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="act_start_time"
              name="act_start_time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          {/* End Time */}
          <div>
            <label htmlFor="act_end_time" className="block text-sm font-medium text-gray-700 mb-2">
              Ora Fine <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="act_end_time"
              name="act_end_time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          {/* Time Worked (editable) */}
          <div>
            <label htmlFor="time_worked_display" className="block text-sm font-medium text-gray-700 mb-2">
              Tempo Impiegato (HH:MM)
            </label>
            <input
              type="text"
              id="time_worked_display"
              value={timeWorked}
              onChange={handleTimeWorkedChange}
              pattern="[0-9]{1,3}:[0-5][0-9]"
              placeholder="00:00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Auto-calcolato, ma modificabile
            </p>
          </div>
        </div>

        {/* Carnet Selector */}
        <CarnetSelector
          carnets={carnets}
          selectedCarnetId={selectedCarnet?.cuscarn_id}
          onCarnetChange={setSelectedCarnet}
        />
        <input type="hidden" name="act_cuscarn_id" value={selectedCarnet?.cuscarn_id || ''} />
        <input type="hidden" name="act_price" value={selectedCarnet?.carn_price || 0} />

        {/* Calculated values display */}
        {selectedCarnet && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-blue-900">Riepilogo Addebito</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Quantità:</span>{' '}
                <span className="font-semibold">{unitQuantity.toFixed(2)} {translateUnitOfMeasure(selectedCarnet.carn_um)}</span>
              </div>
              <div>
                <span className="text-blue-700">Prezzo Unitario:</span>{' '}
                <span className="font-semibold">€{selectedCarnet.carn_price.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-blue-700">Valore Totale:</span>{' '}
                <span className="font-semibold text-lg">€{totalValue.toFixed(2)}</span>
              </div>
            </div>
            <div className="text-xs text-blue-600 mt-2">
              Residuo carnet dopo questa attività: {(selectedCarnet.cuscarn_qtaini - (selectedCarnet.cuscarn_qtaero + unitQuantity)).toFixed(2)} {translateUnitOfMeasure(selectedCarnet.carn_um)}
            </div>
          </div>
        )}

        {/* Note */}
        <div>
          <label htmlFor="act_note" className="block text-sm font-medium text-gray-700 mb-2">
            Note Interne
          </label>
          <textarea
            id="act_note"
            name="act_note"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Note interne non inviate all'utente..."
          />
          <p className="mt-1 text-xs text-gray-500">
            Queste note sono solo per uso interno e non verranno inviate via email
          </p>
        </div>

        {/* Close Ticket Checkbox */}
        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <input
            type="checkbox"
            id="act_close"
            name="act_close"
            value="true"
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="act_close" className="text-sm font-medium text-amber-900">
            Chiudi il ticket con questa attività
          </label>
        </div>

        {/* Attachments */}
        <div>
          <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-2">
            Allegati
          </label>
          <input
            type="file"
            id="attachments"
            name="attachments"
            multiple
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          <p className="mt-2 text-xs text-gray-500">
            Puoi allegare più file (max 10MB per file)
          </p>
        </div>

        {/* Send Email Checkbox */}
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <input
            type="checkbox"
            id="send_email"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="send_email" className="text-sm font-medium text-green-900">
            Invia notifica email all&apos;utente che ha creato il ticket
          </label>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedCarnet}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Salvataggio...' : 'Conferma Attività'}
          </button>
        </div>
      </div>
    </form>
  );
}
