import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { createCarnet } from '@/app/actions/carnets';
import { CarnetCreateForm } from './carnet-create-form';

export default async function NewCarnetPage() {
  await requireRole([0, 1]);  // Admin and Partner

  async function handleCreateCarnet(formData: FormData) {
    'use server';
    return await createCarnet(formData);
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Crea Nuovo Carnet</h2>
          <p className="text-gray-600 mt-1">Aggiungi un nuovo carnet al sistema</p>
        </div>

        <CarnetCreateForm createAction={handleCreateCarnet} />
      </div>
    </DashboardLayout>
  );
}
