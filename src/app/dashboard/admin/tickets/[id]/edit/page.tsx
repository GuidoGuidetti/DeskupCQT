import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { prisma } from '@/lib/prisma';
import { TicketForm } from '@/components/ticket-form';
import { notFound } from 'next/navigation';

export default async function EditTicketPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole([0, 1]); // Admin and Partner
  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { tick_id: parseInt(id) },
    include: {
      attachments: true,
      user: {
        include: {
          partner: {
            select: { part_email: true },
          },
        },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Modifica Ticket #{ticket.tick_id}</h2>
          <p className="text-gray-600 mt-1">Aggiorna i dettagli del ticket</p>
        </div>

        <TicketForm
          userCustomer={null}
          userRole={0}
          partnerEmail={ticket.user?.partner?.part_email}
          ticket={{
            tick_id: ticket.tick_id,
            tick_title: ticket.tick_title,
            tick_description: ticket.tick_description,
            tick_priority: ticket.tick_priority,
            tick_status: ticket.tick_status,
            attachments: ticket.attachments,
          }}
        />
      </div>
    </DashboardLayout>
  );
}
