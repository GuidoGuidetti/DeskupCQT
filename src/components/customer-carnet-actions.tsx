'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCustomerCarnet } from '@/app/actions/customer-carnets';
import { PencilIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';

interface CustomerCarnetActionsProps {
  customerCarnetId: number;
  customerId: number;
}

export function CustomerCarnetActions({ customerCarnetId, customerId }: CustomerCarnetActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo carnet?')) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteCustomerCarnet(customerCarnetId, customerId);

      if (result.success) {
        router.refresh();
      } else if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      alert('Errore durante l\'eliminazione del carnet');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/dashboard/admin/customers/${customerId}/carnets/${customerCarnetId}/edit`}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Modifica carnet"
      >
        <PencilIcon className="w-4 h-4" />
      </Link>

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        title="Elimina carnet"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
