'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ActivityForm } from '@/components/activity-form';
import { createActivityWithAttachments } from '@/app/actions/activities';

interface ActivityFormWrapperProps {
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
}

export function ActivityFormWrapper({ ticketId, customerId, carnets }: ActivityFormWrapperProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData, sendEmail: boolean) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createActivityWithAttachments(formData, sendEmail);

      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
      }
      // If successful, the server action will redirect automatically
    } catch (err) {
      setError('Errore durante il salvataggio dell\'attività');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/admin/tickets/${ticketId}/activities`);
  };

  return (
    <div>
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <ActivityForm
        ticketId={ticketId}
        customerId={customerId}
        carnets={carnets}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
