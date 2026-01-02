import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PartnerForm } from '@/components/partner-form';

export default async function NewPartnerPage() {
  await requireRole([0]); // Admin only

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Nuovo Partner</h2>
          <p className="text-gray-600 mt-1">Crea un nuovo partner</p>
        </div>

        <PartnerForm />
      </div>
    </DashboardLayout>
  );
}
