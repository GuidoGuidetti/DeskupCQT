import { requireRole, getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ActivitiesTable } from '@/components/activities-table';

export default async function ActivitiesPage() {
  // Require admin or partner role
  await requireRole([0, 1]);

  // Get session to determine partner filtering
  const session = await getSession();

  // Build where clause for partner filtering
  const whereClause = session?.usr_role === 1 && session.usr_part_id
    ? {
        customer: {
          cust_part_id: session.usr_part_id
        }
      }
    : {};

  // Fetch all activities with relations
  const activities = await prisma.activity.findMany({
    where: whereClause,
    include: {
      ticket: {
        include: {
          user: {
            select: {
              usr_id: true,
              usr_name: true
            }
          }
        }
      },
      customer: {
        select: {
          cust_id: true,
          cust_name: true
        }
      },
      customerCarnet: {
        include: {
          carnet: {
            select: {
              carn_um: true,
              carn_type: true
            }
          }
        }
      }
    },
    orderBy: {
      act_date: 'desc'
    }
  });

  // Serialize Decimal fields to numbers for client component
  const serializedActivities = activities.map(activity => ({
    ...activity,
    act_unit_qta: Number(activity.act_unit_qta),
    act_price: Number(activity.act_price),
    act_value: Number(activity.act_value)
  }));

  // Extract unique users from activities for filter dropdown
  const usersMap = new Map<number, { usr_id: number; usr_name: string | null }>();
  activities.forEach(activity => {
    if (!usersMap.has(activity.ticket.user.usr_id)) {
      usersMap.set(activity.ticket.user.usr_id, {
        usr_id: activity.ticket.user.usr_id,
        usr_name: activity.ticket.user.usr_name
      });
    }
  });
  const users = Array.from(usersMap.values()).sort((a, b) => {
    const nameA = a.usr_name || '';
    const nameB = b.usr_name || '';
    return nameA.localeCompare(nameB);
  });

  // Extract unique customers from activities for filter dropdown
  const customersMap = new Map<number, { cust_id: number; cust_name: string | null }>();
  activities.forEach(activity => {
    if (!customersMap.has(activity.customer.cust_id)) {
      customersMap.set(activity.customer.cust_id, {
        cust_id: activity.customer.cust_id,
        cust_name: activity.customer.cust_name
      });
    }
  });
  const customers = Array.from(customersMap.values()).sort((a, b) => {
    const nameA = a.cust_name || '';
    const nameB = b.cust_name || '';
    return nameA.localeCompare(nameB);
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Attività</h1>
        </div>

        <ActivitiesTable
          activities={serializedActivities}
          users={users}
          customers={customers}
        />
      </div>
    </DashboardLayout>
  );
}
