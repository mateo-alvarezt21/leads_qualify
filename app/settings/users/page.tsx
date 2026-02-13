import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Shield, User as UserIcon } from 'lucide-react';
import { CreateUserDialog } from '@/components/CreateUserDialog';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
    const session = await getSession();
    if (!session?.user?.organizationId || !['admin', 'superadmin'].includes(session.user.role)) {
        redirect('/');
    }

    const users = await prisma.user.findMany({
        where: { organizationId: session.user.organizationId },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-brand transition-colors">
                        <ArrowLeft size={18} /> Volver al Inicio
                    </Link>
                </div>

                <header className="mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-light mb-2 flex items-center gap-3">
                            Gestión de <span className="text-brand font-semibold">Usuarios</span>
                        </h1>
                        <p className="text-zinc-500">
                            Administra quién tiene acceso a la plataforma.
                        </p>
                    </div>
                    <CreateUserDialog />
                </header>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="p-4 font-medium text-zinc-500">Usuario</th>
                                <th className="p-4 font-medium text-zinc-500">Email</th>
                                <th className="p-4 font-medium text-zinc-500">Rol</th>
                                <th className="p-4 font-medium text-zinc-500">Fecha Registro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500">
                                            <UserIcon size={16} />
                                        </div>
                                        <span className="font-medium">{u.name || 'Sin nombre'}</span>
                                    </td>
                                    <td className="p-4 text-zinc-500">{u.email}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300' : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                            {u.role === 'admin' && <Shield size={10} />}
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-zinc-400 text-xs">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
