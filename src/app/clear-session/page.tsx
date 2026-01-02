import { logout } from '@/app/actions/auth';

export default function ClearSessionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Cancella Sessione</h1>
        <p className="text-gray-600 mb-6">
          Clicca il pulsante per cancellare completamente la tua sessione
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Cancella Sessione e Vai al Login
          </button>
        </form>
      </div>
    </div>
  );
}
