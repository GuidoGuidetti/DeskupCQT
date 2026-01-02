'use client';

import { TrashIcon } from 'lucide-react';
import { useTransition } from 'react';

interface DeleteActivityButtonProps {
  activityId: number;
  deleteAction: (activityId: number) => Promise<{ error?: string }>;
}

export function DeleteActivityButton({ activityId, deleteAction }: DeleteActivityButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!window.confirm('Sei sicuro di voler eliminare questa attività? Questa operazione non può essere annullata.')) {
      return;
    }

    startTransition(async () => {
      const result = await deleteAction(activityId);
      if (result?.error) {
        alert(`Errore durante l'eliminazione: ${result.error}`);
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Elimina attività"
      aria-label="Elimina attività"
    >
      <TrashIcon className="w-4 h-4" />
    </button>
  );
}
