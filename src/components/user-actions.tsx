'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteUser } from '@/app/actions/users';
import { PencilIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';

interface UserActionsProps {
  userId: number;
  ticketCount: number;
}

export function UserActions({ userId, ticketCount }: UserActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const message = ticketCount > 0
      ? `Questo utente ha ${ticketCount} ticket collegati. Eliminando l'utente verranno eliminati anche tutti i ticket. Sei sicuro?`
      : 'Sei sicuro di voler eliminare questo utente?';

    const confirmed = window.confirm(message);

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    const result = await deleteUser(userId, true);

    if (result.error) {
      alert(result.error);
      setIsDeleting(false);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/dashboard/admin/users/${userId}/edit`}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title="Modifica utente"
      >
        <PencilIcon className="w-4 h-4" />
      </Link>

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
        title="Elimina utente"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
