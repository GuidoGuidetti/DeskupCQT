'use client';

import { useState } from 'react';
import { createTicketWithAttachments, updateTicketWithAttachments, updateTicketAndResendEmail } from '@/app/actions/tickets';

interface TicketFormProps {
  userCustomer: { cust_id: number; cust_name: string | null } | null;
  userRole: number;
  partnerEmail?: string | null;
  ticket?: {
    tick_id: number;
    tick_title: string;
    tick_description: string | null;
    tick_priority: string;
    tick_status: string;
    attachments?: Array<{
      att_id: number;
      att_filename: string;
      att_filepath: string;
    }>;
  };
}

export function TicketForm({ userCustomer, userRole, partnerEmail, ticket }: TicketFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingWithEmail, setIsSubmittingWithEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!ticket;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = isEditMode
      ? await updateTicketWithAttachments(ticket.tick_id, formData)
      : await createTicketWithAttachments(formData);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
    // If successful, the server action will redirect automatically
  };

  const handleSubmitWithEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingWithEmail(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    // Update ticket and resend email in one action
    const result = await updateTicketAndResendEmail(ticket!.tick_id, formData);

    if (result?.error) {
      setError(result.error);
      setIsSubmittingWithEmail(false);
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

        {/* Titolo */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Titolo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            defaultValue={ticket?.tick_title || ''}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Inserisci il titolo del ticket"
          />
        </div>

        {/* Descrizione */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descrizione
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            defaultValue={ticket?.tick_description || ''}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Descrivi in dettaglio la tua richiesta..."
          />
        </div>

        {/* Priorità */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
            Priorità
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue={ticket?.tick_priority || 'medium'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="low">Bassa</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>

        {/* Status - solo in edit mode e per admin/partner */}
        {isEditMode && (userRole === 0 || userRole === 1) && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Stato
            </label>
            <select
              id="status"
              name="status"
              defaultValue={ticket?.tick_status || 'open'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="open">Aperto</option>
              <option value="in_progress">In Lavorazione</option>
              <option value="waiting">In Attesa</option>
              <option value="closed">Chiuso</option>
            </select>
          </div>
        )}

        {/* Cliente - auto-populated from logged user */}
        {userCustomer && (
          <div>
            <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-2">
              Cliente
            </label>
            <input
              type="text"
              value={userCustomer.cust_name || 'N/A'}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <input type="hidden" name="customer_id" value={userCustomer.cust_id} />
          </div>
        )}

        {/* Allegati esistenti - solo in edit mode */}
        {isEditMode && ticket?.attachments && ticket.attachments.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allegati esistenti
            </label>
            <div className="space-y-2">
              {ticket.attachments.map((att) => (
                <div key={att.att_id} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                  <a
                    href={att.att_filepath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:underline flex-1"
                  >
                    {att.att_filename}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Allegati - nuovi */}
        <div>
          <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-2">
            {isEditMode ? 'Aggiungi nuovi allegati' : 'Allegati'}
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

        {/* Buttons */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-end gap-4">
            <a
              href={userRole === 0 || userRole === 1 ? '/dashboard/admin/tickets' : '/dashboard/user/tickets'}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annulla
            </a>
            <button
              type="submit"
              disabled={isSubmitting || isSubmittingWithEmail}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? (isEditMode ? 'Aggiornamento...' : 'Creazione...')
                : (isEditMode ? 'Crea Ticket' : 'Crea Ticket')
              }
            </button>
            {isEditMode && (
              <button
                type="button"
                onClick={(e) => {
                  const form = e.currentTarget.closest('form');
                  if (form) {
                    const syntheticEvent = {
                      preventDefault: () => {},
                      currentTarget: form
                    } as React.FormEvent<HTMLFormElement>;
                    handleSubmitWithEmail(syntheticEvent);
                  }
                }}
                disabled={isSubmitting || isSubmittingWithEmail}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingWithEmail
                  ? 'Aggiornamento e invio...'
                  : 'Aggiorna Ticket e Re-Invia Mail'
                }
              </button>
            )}
          </div>
          {partnerEmail && (
            <p className="mt-3 text-xs text-gray-600">
              {isEditMode
                ? `La mail verrà inviata a: ${partnerEmail}`
                : `Alla creazione del ticket verrà inviata una mail a: ${partnerEmail}`
              }
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
