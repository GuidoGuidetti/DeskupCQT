import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { ActivityFormWrapper } from './activity-form-wrapper';

export default async function NewActivityPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole([0, 1]); // Admin and Partner
  const { id } = await params;
  const ticketId = parseInt(id);

  // Fetch ticket
  const ticket = await prisma.ticket.findUnique({
    where: { tick_id: ticketId },
    include: {
      customer: true,
      user: true,
    },
  });

  if (!ticket) {
    notFound();
  }

  if (!ticket.tick_cust_id) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Questo ticket non ha un cliente associato. Non è possibile creare un&apos;attività.
          </div>
          <Link
            href={`/dashboard/admin/tickets/${ticketId}/activities`}
            className="mt-4 inline-block text-primary-600 hover:underline"
          >
            ← Torna alle attività
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Fetch active carnets for the customer
  const activeCarnetsRaw = await prisma.customerCarnet.findMany({
    where: {
      cuscarn_cust_id: ticket.tick_cust_id,
      cuscarn_active: true,
    },
    include: {
      carnet: true,
    },
    orderBy: {
      cuscarn_datestart: 'desc',
    },
  });

  // Convert Decimal to number for client components
  const activeCarnets = activeCarnetsRaw.map(cc => ({
    cuscarn_id: cc.cuscarn_id,
    cuscarn_qtaini: cc.cuscarn_qtaini,
    cuscarn_qtaero: cc.cuscarn_qtaero,
    carnet: cc.carnet ? {
      carn_id: cc.carnet.carn_id,
      carn_des: cc.carnet.carn_des,
      carn_um: cc.carnet.carn_um,
      carn_price: Number(cc.carnet.carn_price),
    } : null,
  }));

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/dashboard/admin/tickets" className="hover:text-primary-600">
            Tickets
          </Link>
          <span>/</span>
          <Link
            href={`/dashboard/admin/tickets/${ticketId}/activities`}
            className="hover:text-primary-600"
          >
            #{ticketId} Attività
          </Link>
          <span>/</span>
          <span className="text-gray-900">Nuova</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Nuova Attività</h1>
            <Link
              href="/dashboard/admin/tickets"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Torna ai Tickets
            </Link>
          </div>
          <p className="text-gray-600 mt-2">
            <strong>Ticket:</strong> #{ticket.tick_id} - {ticket.tick_title}
          </p>
          {ticket.customer && (
            <p className="text-gray-600">
              <strong>Cliente:</strong> {ticket.customer.cust_name}
            </p>
          )}
        </div>

        {/* Warning if no active carnets */}
        {activeCarnets.length === 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded">
            <p className="font-semibold">Attenzione</p>
            <p className="text-sm mt-1">
              Nessun carnet attivo trovato per questo cliente. Contatta l&apos;amministratore per
              attivare un carnet prima di creare un&apos;attività.
            </p>
          </div>
        )}

        {/* Form */}
        <ActivityFormWrapper
          ticketId={ticketId}
          customerId={ticket.tick_cust_id}
          carnets={activeCarnets}
        />
      </div>
    </DashboardLayout>
  );
}
