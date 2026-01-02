import { requireRole } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { prisma } from '@/lib/prisma';
import { PartnerForm } from '@/components/partner-form';
import { notFound } from 'next/navigation';

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole([0]); // Admin only
  const { id } = await params;

  const partner = await prisma.partner.findUnique({
    where: { part_id: parseInt(id) },
  });

  if (!partner) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Modifica Partner #{partner.part_id}</h2>
          <p className="text-gray-600 mt-1">Aggiorna i dettagli del partner</p>
        </div>

        <PartnerForm partner={partner} />
      </div>
    </DashboardLayout>
  );
}
