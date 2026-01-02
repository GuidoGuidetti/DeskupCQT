import { requireAuth, getSession } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { prisma } from '@/lib/prisma';
import { TicketForm } from '@/components/ticket-form';

export default async function NewTicketPage() {
  await requireAuth();
  const session = await getSession();

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
          <h2 className="text-2xl font-bold text-gray-900">Crea Nuovo Ticket</h2>
          <p className="text-gray-600 mt-1">Compila il form per aprire una nuova richiesta di supporto</p>
        </div>

        <TicketForm
          userCustomer={userCustomer}
          userRole={session?.usr_role ?? 2}
          partnerEmail={userPartner?.part_email}
        />
      </div>
    </DashboardLayout>
  );
}
