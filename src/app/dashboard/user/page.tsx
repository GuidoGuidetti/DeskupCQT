import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import Link from 'next/link';
import { PlusCircleIcon, ListIcon } from 'lucide-react';

export default async function UserDashboard() {
  // Only allow role 2 (user)
  await requireRole([2]);

  const menuItems = [
    {
      title: 'Apri un nuovo Ticket',
      description: 'Crea una nuova richiesta di supporto',
      icon: PlusCircleIcon,
      href: '/dashboard/user/tickets/new',
      color: 'bg-primary-100 text-primary-600',
    },
    {
      title: 'Consulta i tuoi Tickets',
      description: 'Visualizza lo stato dei tuoi tickets',
      icon: ListIcon,
      href: '/dashboard/user/tickets',
      color: 'bg-green-100 text-green-600',
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Utente</h2>
          <p className="text-gray-600">Gestisci i tuoi tickets di supporto</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className={`w-16 h-16 rounded-lg ${item.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
