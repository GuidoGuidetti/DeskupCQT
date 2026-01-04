import { login } from '../actions/auth';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';

export default async function LoginPage() {
  const session = await getSession();

  // If already logged in, redirect to appropriate dashboard
  if (session) {
    if (session.usr_role === 0) {
      redirect('/dashboard/admin');
    } else {
      redirect('/dashboard/user');
    }
  }

  async function handleLogin(formData: FormData) {
    'use server';
    await login(formData);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo-admin.png"
              alt="DeskUp Logo"
              width={150}
              height={150}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-primary-600 mb-2">DeskUp</h1>
          <p className="text-gray-600">Sistema di Gestione Tickets</p>
        </div>

        <form action={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="nome@esempio.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Accedi
          </button>
        </form>
      </div>
    </div>
  );
}
