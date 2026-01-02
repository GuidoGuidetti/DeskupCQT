import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PlusCircleIcon, PaperclipIcon, CheckCircleIcon, XCircleIcon, EditIcon, ArrowLeftIcon } from 'lucide-react';
import { DeleteActivityButton } from '@/components/delete-activity-button';
import { deleteActivity } from '@/app/actions/activities';
import { minutesToFormatted, translateUnitOfMeasure, getUnitBadgeColor } from '@/lib/activity-calculations';

export default async function ActivitiesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole([0, 1]); // Admin and Partner
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
            <Link href="/dashboard/admin/tickets" className="hover:text-primary-600">
              Tickets
            </Link>
            <span>/</span>
            <span>#{ticket.tick_id}</span>
            <span>/</span>
            <span className="text-gray-900">Attività</span>
          </div>

          <div className="flex items-start justify-between">
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
              <p className="text-gray-600">
                <strong>Utente:</strong> {ticket.user.usr_name}
              </p>
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

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/admin/tickets"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Torna ai Tickets
              </Link>
              <Link
                href={`/dashboard/admin/tickets/${ticketId}/activities/new`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Nuova Attività
              </Link>
            </div>
          </div>
        </div>

        {/* Activities table */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          {ticket.activities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">Nessuna attività registrata per questo ticket</p>
              <p className="text-sm mt-2">Clicca su &quot;Nuova Attività&quot; per iniziare</p>
            </div>
          ) : (
            <>
              <table className="w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
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
                      Chiude
                    </th>
                    <th className="w-20 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Allegati
                    </th>
                    <th className="w-24 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ticket.activities.map((activity) => {
                    const startTime = activity.act_start_time.toISOString().split('T')[1].substring(0, 5);
                    const endTime = activity.act_end_time.toISOString().split('T')[1].substring(0, 5);
                    const timeFormatted = minutesToFormatted(activity.act_time);
                    const um = activity.customerCarnet?.carnet?.carn_um || 'T';

                    return (
                      <tr key={activity.act_id} className="hover:bg-gray-50">
                        <td className="px-3 py-4 text-sm text-gray-900">
                          #{activity.act_id}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {new Date(activity.act_date).toLocaleDateString('it-IT')}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {startTime} - {endTime}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                          {timeFormatted}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 truncate" title={activity.act_description}>
                          {activity.act_description}
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
                          {activity.act_close ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircleIcon className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
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
                        <td className="px-3 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <Link
                              href={`/dashboard/admin/tickets/${ticketId}/activities/${activity.act_id}/edit`}
                              className="p-1.5 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded transition-colors"
                              title="Modifica attività"
                            >
                              <EditIcon className="w-4 h-4" />
                            </Link>
                            <DeleteActivityButton
                              activityId={activity.act_id}
                              deleteAction={deleteActivity}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Footer with totals */}
                <tfoot className="bg-gray-100">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      TOTALI:
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">
                      {minutesToFormatted(totalMinutes)}
                    </td>
                    <td colSpan={3}></td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      €{totalValue.toFixed(2)}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
