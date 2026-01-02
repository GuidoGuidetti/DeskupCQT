'use client';

import { TrashIcon } from 'lucide-react';
import { useTransition } from 'react';

interface DeleteCarnetButtonProps {
  carnetId: number;
  deleteAction: (carnetId: number) => Promise<{ error?: string; success?: boolean }>;
}

export function DeleteCarnetButton({ carnetId, deleteAction }: DeleteCarnetButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!window.confirm('Sei sicuro di voler eliminare questo carnet? Questa operazione non può essere annullata.')) {
      return;
    }

    startTransition(async () => {
      const result = await deleteAction(carnetId);
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
      title="Elimina carnet"
      aria-label="Elimina carnet"
    >
      <TrashIcon className="w-5 h-5" />
    </button>
  );
}
