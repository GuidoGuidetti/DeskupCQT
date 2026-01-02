'use client';

import { useState } from 'react';
import Image from 'next/image';
import { createPartner, updatePartner } from '@/app/actions/partners';
import { SaveIcon, UploadIcon, XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PartnerFormProps {
  partner?: {
    part_id: number;
    part_name: string | null;
    part_email: string | null;
    part_data: string | null;
    part_logo: string | null;
  };
}

export function PartnerForm({ partner }: PartnerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(partner?.part_logo || null);

  const isEditMode = !!partner;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        alert('Il logo non può superare i 5MB');
        e.target.value = '';
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Il file deve essere un\'immagine');
        e.target.value = '';
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    const fileInput = document.getElementById('logo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = isEditMode
        ? await updatePartner(partner.part_id, formData)
        : await createPartner(formData);

      if (result?.error) {
        alert(result.error);
        setIsSubmitting(false);
      }
      // If successful, the action will redirect
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      <div className="space-y-6">
        {/* Nome */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nome Partner *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={partner?.part_name || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Nome del partner"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={partner?.part_email || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="email@esempio.com"
          />
        </div>

        {/* Data */}
        <div>
          <label htmlFor="data" className="block text-sm font-medium text-gray-700 mb-2">
            Dati aggiuntivi
          </label>
          <textarea
            id="data"
            name="data"
            rows={4}
            defaultValue={partner?.part_data || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Note, informazioni aggiuntive..."
          />
        </div>

        {/* Logo Upload */}
        <div>
          <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">
            Logo
          </label>

          {logoPreview && (
            <div className="mb-4 relative inline-block">
              <Image
                src={logoPreview}
                alt="Logo preview"
                width={200}
                height={100}
                unoptimized
                className="max-w-[200px] max-h-[100px] object-contain border border-gray-300 rounded-lg"
              />
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                title="Rimuovi logo"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-4">
            <label
              htmlFor="logo"
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <UploadIcon className="w-5 h-5 mr-2" />
              {logoPreview ? 'Cambia Logo' : 'Carica Logo'}
            </label>
            <input
              type="file"
              id="logo"
              name="logo"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
            <span className="text-sm text-gray-500">Max 5MB, formato immagine</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SaveIcon className="w-5 h-5 mr-2" />
            {isSubmitting ? 'Salvataggio...' : isEditMode ? 'Aggiorna Partner' : 'Crea Partner'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Annulla
          </button>
        </div>
      </div>
    </form>
  );
}
