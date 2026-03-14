'use client';

import { useState } from 'react';
import { Brain, Smartphone, Palette, GitBranch, Layers, Users } from 'lucide-react';

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        label: 'Automatización',
        items: [
            { id: 'ia', label: 'IA & Calificación', icon: <Brain size={15} /> },
        ],
    },
    {
        label: 'Canales',
        items: [
            { id: 'whatsapp', label: 'WhatsApp', icon: <Smartphone size={15} /> },
        ],
    },
    {
        label: 'Apariencia',
        items: [
            { id: 'apariencia', label: 'Idioma & Marca', icon: <Palette size={15} /> },
        ],
    },
    {
        label: 'Pipeline',
        items: [
            { id: 'pipeline', label: 'Estados', icon: <GitBranch size={15} /> },
            { id: 'campos', label: 'Campos personalizados', icon: <Layers size={15} /> },
        ],
    },
    {
        label: 'Equipo',
        items: [
            { id: 'usuarios', label: 'Usuarios', icon: <Users size={15} /> },
        ],
    },
];

const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items);

export function SettingsShell({ sections }: { sections: Record<string, React.ReactNode> }) {
    const [active, setActive] = useState('ia');

    return (
        <div className="flex gap-8 min-h-[70vh]">

            {/* ── Sidebar (desktop) ── */}
            <aside className="hidden md:block w-52 shrink-0">
                <nav className="sticky top-8 space-y-5">
                    {NAV_GROUPS.map(group => (
                        <div key={group.label}>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 px-3 mb-1">
                                {group.label}
                            </p>
                            <div className="space-y-0.5">
                                {group.items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActive(item.id)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left relative ${
                                            active === item.id
                                                ? 'bg-brand/10 text-brand font-semibold'
                                                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-800 dark:hover:text-zinc-200'
                                        }`}
                                    >
                                        {active === item.id && (
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand rounded-r-full" />
                                        )}
                                        <span className={active === item.id ? 'text-brand' : 'text-zinc-400 dark:text-zinc-500'}>
                                            {item.icon}
                                        </span>
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* ── Tabs (mobile) ── */}
            <div className="md:hidden w-full">
                <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-hide">
                    {ALL_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActive(item.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all shrink-0 ${
                                active === item.id
                                    ? 'bg-brand text-white font-semibold shadow-sm'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 min-w-0">
                {sections[active] ?? null}
            </div>
        </div>
    );
}
