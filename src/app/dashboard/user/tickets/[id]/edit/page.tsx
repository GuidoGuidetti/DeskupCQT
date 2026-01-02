import { requireAuth, getSession } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { prisma } from '@/lib/prisma';
import { TicketForm } from '@/components/ticket-form';
import { notFound, redirect } from 'next/navigation';

export default async function EditTicketPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const session = await getSession();
  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { tick_id: parseInt(id) },
    include: {
      attachments: true,
    },
  });

  if (!ticket) {
    notFound();
  }

  // Users can only edit their own tickets
  if (session!.usr_role === 2 && ticket.tick_usr_id !== session!.usr_id) {
    redirect('/dashboard/user/tickets');
  }

  // Get user's customer if exists
  const userCustomer = session?.usr_cust_id ? await prisma.customer.findUnique({
    where: { cust_id: session.usr_cust_id },
  }) : null;

  // Get user's partner email if exists
  const userPartner = session?.usr_part_id ? await prisma.partner.findUnique({
    where: { part_id: session.usr_part_id },
    select: { part_email: true },
  }) : null;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Modifica Ticket #{ticket.tick_id}</h2>
          <p className="text-gray-600 mt-1">Aggiorna i dettagli del ticket</p>
        </div>

        <TicketForm
          userCustomer={userCustomer}
          userRole={session?.usr_role ?? 2}
          partnerEmail={userPartner?.part_email}
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
