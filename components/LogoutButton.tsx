'use client'

import { logoutAction } from '@/app/actions/auth';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
    return (
        <button
            onClick={() => logoutAction()}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-red-500 transition-colors"
        >
            <LogOut size={16} /> Cerrar Sesión
        </button>
    );
}
