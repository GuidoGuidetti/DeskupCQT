import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import Link from 'next/link';
import { UsersIcon, BuildingIcon, TicketIcon, CreditCardIcon, BriefcaseIcon } from 'lucide-react';

export default async function AdminDashboard() {
  // Only allow role 0 (admin)
  await requireRole([0]);

  const menuItems = [
    {
      title: 'Utenti',
      description: 'Gestisci gli utenti del sistema',
      icon: UsersIcon,
      href: '/dashboard/admin/users',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Clienti',
      description: 'Gestisci i clienti',
      icon: BuildingIcon,
      href: '/dashboard/admin/customers',
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Partners',
      description: 'Gestisci i partners del sistema',
      icon: BriefcaseIcon,
      href: '/dashboard/admin/partners',
      color: 'bg-indigo-100 text-indigo-600',
    },
    {
      title: 'Carnets',
      description: 'Gestisci i carnets',
      icon: CreditCardIcon,
      href: '/dashboard/admin/carnets',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Tickets',
      description: 'Gestisci tutti i tickets del sistema',
      icon: TicketIcon,
      href: '/dashboard/admin/tickets',
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Amministratore</h2>
          <p className="text-gray-600">Gestisci tutte le funzionalità del sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
