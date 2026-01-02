'use client';

import { useTransition } from 'react';
import { MailIcon } from 'lucide-react';

interface ResendEmailButtonProps {
  ticketId: number;
  resendAction: (ticketId: number) => Promise<{ error?: string; success?: boolean; message?: string }>;
}

export function ResendEmailButton({ ticketId, resendAction }: ResendEmailButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleResend = () => {
    const confirmed = window.confirm(
      'Sei sicuro di voler reinviare l\'email per questo ticket?'
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await resendAction(ticketId);

      if (result.error) {
        alert(result.error);
      } else {
        alert(result.message || 'Email reinviata con successo!');
      }
    });
  };

  return (
    <button
      onClick={handleResend}
      disabled={isPending}
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Reinvia Email"
    >
      <MailIcon className="w-5 h-5 mr-2" />
      {isPending ? 'Invio in corso...' : 'Reinvia Mail'}
    </button>
  );
}
