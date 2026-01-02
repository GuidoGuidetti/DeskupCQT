'use client';

import { useState } from 'react';
import { deleteTicket } from '@/app/actions/tickets';
import { TrashIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DeleteTicketButtonProps {
  ticketId: number;
}

export function DeleteTicketButton({ ticketId }: DeleteTicketButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Sei sicuro di voler eliminare questo ticket? Questa azione non può essere annullata.'
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    const result = await deleteTicket(ticketId);

    if (result.error) {
      alert(result.error);
      setIsDeleting(false);
    } else {
      // Refresh the page to show updated list
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Elimina"
    >
      <TrashIcon className="w-4 h-4" />
    </button>
  );
}
