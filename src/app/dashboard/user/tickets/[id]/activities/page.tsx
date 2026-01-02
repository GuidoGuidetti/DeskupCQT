import { requireAuth, getSession } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { PaperclipIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { minutesToFormatted, translateUnitOfMeasure, getUnitBadgeColor } from '@/lib/activity-calculations';

export default async function UserActivitiesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const session = await getSession();
  const { id } = await params;
  const ticketId = parseInt(id);

  // Fetch ticket with activities
  const ticket = await prisma.ticket.findUnique({
    where: { tick_id: ticketId },
    include: {
      user: true,
      customer: true,
      activities: {
        include: {
          customerCarnet: {
            include: {
              carnet: true,
            },
          },
          attachments: true,
        },
        orderBy: {
          act_date: 'desc',
        },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  // Users can only view their own tickets
  if (session!.usr_role === 2 && ticket.tick_usr_id !== session!.usr_id) {
    redirect('/dashboard/user/tickets');
  }

  // Calculate totals
  const totalMinutes = ticket.activities.reduce((sum, act) => sum + act.act_time, 0);
  const totalValue = ticket.activities.reduce((sum, act) => sum + Number(act.act_value), 0);

  // Status badge colors
  const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    waiting: 'bg-purple-100 text-purple-800',
    closed: 'bg-green-100 text-green-800',
  };

  const statusLabels: Record<string, string> = {
    open: 'Aperto',
    in_progress: 'In Lavorazione',
    waiting: 'In Attesa',
    closed: 'Chiuso',
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/user/tickets" className="hover:text-primary-600">
              I Miei Tickets
            </Link>
            <span>/</span>
            <span>#{ticket.tick_id}</span>
            <span>/</span>
            <span className="text-gray-900">Attività</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Attività del Ticket #{ticket.tick_id}
            </h1>
            <p className="text-gray-600 mt-2">
              <strong>Titolo:</strong> {ticket.tick_title}
            </p>
            {ticket.customer && (
              <p className="text-gray-600">
                <strong>Cliente:</strong> {ticket.customer.cust_name}
              </p>
            )}
            <div className="mt-2">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  statusColors[ticket.tick_status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {statusLabels[ticket.tick_status] || ticket.tick_status}
              </span>
            </div>
          </div>
        </div>

        {/* Activities table */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          {ticket.activities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">Nessuna attività registrata per questo ticket</p>
            </div>
          ) : (
            <>
              <table className="w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orario
                    </th>
                    <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tempo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrizione
                    </th>
                    <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UM
                    </th>
                    <th className="w-24 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qtà
                    </th>
                    <th className="w-28 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valore
                    </th>
                    <th className="w-20 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Allegati
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ticket.activities.map((activity) => {
                    const startTime = activity.act_start_time.toISOString().split('T')[1].substring(0, 5);
                    const endTime = activity.act_end_time.toISOString().split('T')[1].substring(0, 5);
                    const timeFormatted = minutesToFormatted(activity.act_time);
                    const um = activity.customerCarnet?.carnet?.carn_um || 'T';
                    // Use response if available, otherwise description
                    const displayText = activity.act_response || activity.act_description;

                    return (
                      <tr key={activity.act_id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {new Date(activity.act_date).toLocaleDateString('it-IT')}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {startTime} - {endTime}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                          {timeFormatted}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          <div className="line-clamp-2" title={displayText}>
                            {displayText}
                          </div>
                          {activity.act_close && (
                            <div className="mt-2">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                                <CheckCircleIcon className="w-3 h-3" />
                                Ticket Chiuso
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getUnitBadgeColor(um)}`}>
                            {translateUnitOfMeasure(um)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-gray-900">
                          {Number(activity.act_unit_qta).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-sm text-right font-semibold text-gray-900">
                          €{Number(activity.act_value).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {activity.attachments.length > 0 ? (
                            <div className="flex items-center justify-center gap-1">
                              <PaperclipIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {activity.attachments.length}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Footer with totals */}
                <tfoot className="bg-gray-100">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      TOTALI:
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">
                      {minutesToFormatted(totalMinutes)}
                    </td>
                    <td colSpan={3}></td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      €{totalValue.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}
        </div>

        {/* Info message */}
        <div className="mt-4 text-sm text-gray-500 text-center">
          Questa è una vista di sola lettura delle attività svolte sul tuo ticket
        </div>
      </div>
    </DashboardLayout>
  );
}
