import { requireRole, getSession } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { PlusCircleIcon, PaperclipIcon, DownloadIcon, ClipboardListIcon, EditIcon } from 'lucide-react';
import { DeleteTicketButton } from '@/components/delete-ticket-button';

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  waiting: 'bg-gray-100 text-gray-800',
  closed: 'bg-green-100 text-green-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export default async function UserTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole([2]);
  const session = await getSession();
  const params = await searchParams;
  const showOnlyOpen = params.status === 'open';

  const tickets = await prisma.ticket.findMany({
    where: {
      tick_usr_id: session!.usr_id,
      ...(showOnlyOpen ? { tick_status: { not: 'closed' } } : {}),
    },
    include: {
      user: true,
      customer: true,
      attachments: true,
    },
    orderBy: {
      tick_created_at: 'desc',
    },
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">I tuoi Tickets</h2>
            <p className="text-gray-600 mt-1">Visualizza e gestisci le tue richieste di supporto</p>
          </div>
          <Link
            href="/dashboard/user/tickets/new"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Nuovo Ticket
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-4 flex gap-4 items-center">
          <div className="flex gap-2">
            <Link
              href="/dashboard/user/tickets"
              className={`px-4 py-2 rounded-lg transition-colors ${
                !showOnlyOpen
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Tutti
            </Link>
            <Link
              href="/dashboard/user/tickets?status=open"
              className={`px-4 py-2 rounded-lg transition-colors ${
                showOnlyOpen
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Solo aperti
            </Link>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-4">Non hai ancora creato nessun ticket.</p>
            <Link
              href="/dashboard/user/tickets/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Crea il tuo primo ticket
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="w-64 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titolo</th>
                  <th className="w-36 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utente</th>
                  <th className="w-36 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                  <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priorità</th>
                  <th className="w-20 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Allegati</th>
                  <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="w-28 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.tick_id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 text-sm text-gray-900">
                      #{ticket.tick_id}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 truncate">{ticket.tick_title}</div>
                      {ticket.tick_description && (
                        <div className="text-sm text-gray-500 truncate">
                          {ticket.tick_description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      <div className="truncate">{ticket.user.usr_name}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      <div className="truncate">{ticket.customer?.cust_name || '-'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ticket.tick_status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                        {ticket.tick_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.tick_priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800'}`}>
                        {ticket.tick_priority}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 text-center">
                      {ticket.attachments && ticket.attachments.length > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          <PaperclipIcon className="w-4 h-4 text-primary-600" />
                          <span className="text-xs text-gray-700">{ticket.attachments.length}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      <div className="truncate">{formatDateTime(ticket.tick_created_at)}</div>
                    </td>
                    <td className="px-3 py-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/dashboard/user/tickets/${ticket.tick_id}/activities`}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Attività"
                        >
                          <ClipboardListIcon className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/user/tickets/${ticket.tick_id}/edit`}
                          className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Modifica"
                        >
                          <EditIcon className="w-4 h-4" />
                        </Link>
                        <DeleteTicketButton ticketId={ticket.tick_id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
