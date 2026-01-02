'use client';

import { CopyIcon } from 'lucide-react';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface DuplicateCarnetButtonProps {
  carnetId: number;
  duplicateAction: (carnetId: number) => Promise<{ error?: string; success?: boolean }>;
}

export function DuplicateCarnetButton({ carnetId, duplicateAction }: DuplicateCarnetButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDuplicate = () => {
    if (!window.confirm('Vuoi creare una copia di questo carnet?')) {
      return;
    }

    startTransition(async () => {
      const result = await duplicateAction(carnetId);
      if (result?.error) {
        alert(`Errore: ${result.error}`);
      } else if (result?.success) {
        router.refresh();
      }
    });
  };

  return (
    <button
      onClick={handleDuplicate}
      disabled={isPending}
      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Duplica carnet"
      aria-label="Duplica carnet"
    >
      <CopyIcon className="w-5 h-5" />
    </button>
  );
}
