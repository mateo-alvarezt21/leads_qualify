'use client'
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-brand"
            title="Copiar URL"
        >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
        </button>
    );
}
