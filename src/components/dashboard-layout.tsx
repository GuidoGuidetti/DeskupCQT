import { getSession } from '@/lib/auth';
import { logout } from '@/app/actions/auth';
import { LogOutIcon, HomeIcon, ClipboardList } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Determine which logo to show in header
  // Admin: logo-admin.png
  // Partner/User with partner: partner logo from part_logo
  const headerLogoSrc = session?.usr_role === 0
    ? '/logo-admin.png'
    : session?.usr_role !== undefined &&
      session.usr_role > 0 &&
      session.partner?.part_logo
      ? `/${session.partner.part_logo}`
      : null;

  const roleLabel = session?.usr_role === 0
    ? 'Amministratore'
    : session?.usr_role === 1
    ? 'Partner'
    : 'Utente';

  // Determine home URL based on user role
  const homeUrl = session?.usr_role === 0
    ? '/dashboard/admin'
    : session?.usr_role === 1
    ? '/dashboard/partner'
    : '/dashboard/user';

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Content */}
      <div className="relative z-10">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {/* Header logo for admin and partner/user */}
                {headerLogoSrc && (
                  <Image
                    src={headerLogoSrc}
                    alt="Logo"
                    width={120}
                    height={120}
                    className="object-contain"
                    style={{ width: 'auto', height: '120px' }}
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-primary-600">DeskUp</h1>
                  <div className="text-sm text-gray-600">
                    {/* Show partner info if usr_role > 0 and partner exists */}
                    {session?.usr_role !== undefined &&
                    session.usr_role > 0 &&
                    session.partner ? (
                      <div className="space-y-0.5">
                        <p className="font-semibold text-primary-700">
                          {session.partner.part_name}
                        </p>
                        {session.partner.part_data && (
                          <p className="text-xs text-gray-500">
                            {session.partner.part_data}
                          </p>
                        )}
                        <p className="text-xs">
                          {session.usr_name} - <span className="font-medium">{roleLabel}</span>
                        </p>
                      </div>
                    ) : (
                      <p>
                        {session?.usr_name} - <span className="font-medium">{roleLabel}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={homeUrl}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Torna alla home"
                >
                  <HomeIcon className="w-4 h-4" />
                  Home
                </Link>
                {/* Activities link - visible only for admin and partner */}
                {(session?.usr_role === 0 || session?.usr_role === 1) && (
                  <Link
                    href="/dashboard/activities"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Visualizza tutte le attività"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Attività
                  </Link>
                )}
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <LogOutIcon className="w-4 h-4" />
                    Esci
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
