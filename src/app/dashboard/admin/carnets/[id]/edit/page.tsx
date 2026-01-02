import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CarnetEditForm } from './carnet-edit-form';

export default async function EditCarnetPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole([0, 1]); // Admin and Partner
  const { id } = await params;

  const carnet = await prisma.carnet.findUnique({
    where: { carn_id: parseInt(id) },
  });

  if (!carnet) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Modifica Carnet #{carnet.carn_id}</h2>
          <p className="text-gray-600 mt-1">Aggiorna i dettagli del carnet</p>
        </div>

        <CarnetEditForm carnet={{
          carn_id: carnet.carn_id,
          carn_des: carnet.carn_des,
          carn_type: carnet.carn_type,
          carn_um: carnet.carn_um,
          carn_qta: carnet.carn_qta,
          carn_value: carnet.carn_value ? Number(carnet.carn_value) : null,
          carn_price: carnet.carn_price ? Number(carnet.carn_price) : null,
          carn_note: carnet.carn_note,
        }} />
      </div>
    </DashboardLayout>
  );
}
