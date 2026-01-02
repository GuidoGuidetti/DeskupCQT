'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCustomer } from '@/app/actions/customers';
import { PencilIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';

interface CustomerActionsProps {
  customerId: number;
  ticketCount: number;
}

export function CustomerActions({ customerId, ticketCount }: CustomerActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const message = ticketCount > 0
      ? `Questo cliente ha ${ticketCount} ticket collegati. Eliminando il cliente verranno eliminati anche tutti i ticket. Sei sicuro?`
      : 'Sei sicuro di voler eliminare questo cliente?';

    const confirmed = window.confirm(message);

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    const result = await deleteCustomer(customerId, true);

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
        href={`/dashboard/admin/customers/${customerId}/edit`}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title="Modifica cliente"
      >
        <PencilIcon className="w-4 h-4" />
      </Link>

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
        title="Elimina cliente"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
