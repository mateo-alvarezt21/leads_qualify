'use client';

import { useState, useCallback, useRef } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { updateBranding } from '@/app/actions/settings';
import { Palette, Upload, Link2, Crop, Check, Loader2, X, RotateCcw, Image as ImageIcon } from 'lucide-react';

interface BrandingSettingsProps {
    currentLogo: string | null;
    currentColor: string | null;
    orgName: string;
}

const DEFAULT_COLOR = '#e0a641';

export function BrandingSettings({ currentLogo, currentColor, orgName }: BrandingSettingsProps) {
    const [logo, setLogo] = useState<string | null>(currentLogo);
    const [brandColor, setBrandColor] = useState(currentColor || DEFAULT_COLOR);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Cropper state
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    // URL input
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlValue, setUrlValue] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    // Read file as base64
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Solo se permiten imágenes (PNG, JPG, SVG)' });
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'La imagen no puede pesar más de 2MB' });
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setImageToCrop(reader.result as string);
            setMessage(null);
        };
        reader.readAsDataURL(file);
        // Reset input so same file can be re-selected
        e.target.value = '';
    };

    // Handle URL
    const handleUrlSubmit = () => {
        const url = urlValue.trim();
        if (!url) return;

        try {
            new URL(url);
        } catch {
            setMessage({ type: 'error', text: 'URL inválida' });
            return;
        }

        // For URLs, set directly without cropping
        setLogo(url);
        setShowUrlInput(false);
        setUrlValue('');
        setMessage(null);
    };

    // Crop and save the image
    const handleCropConfirm = async () => {
        if (!imageToCrop || !croppedAreaPixels) return;

        try {
            const croppedBase64 = await getCroppedImg(imageToCrop, croppedAreaPixels);
            setLogo(croppedBase64);
            setImageToCrop(null);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
        } catch {
            setMessage({ type: 'error', text: 'Error al recortar la imagen' });
        }
    };

    const handleCropCancel = () => {
        setImageToCrop(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    const handleRemoveLogo = () => {
        setLogo(null);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        const res = await updateBranding({
            logo,
            brandColor: brandColor === DEFAULT_COLOR ? null : brandColor,
        });

        setSaving(false);
        if (res.success) {
            setMessage({ type: 'success', text: 'Marca actualizada correctamente' });
            // Force page reload to apply branding everywhere
            setTimeout(() => window.location.reload(), 800);
        } else {
            setMessage({ type: 'error', text: res.error || 'Error al guardar' });
        }
    };

    const hasChanges = logo !== currentLogo || brandColor !== (currentColor || DEFAULT_COLOR);

    return (
        <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 shadow-sm">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                <Palette className="text-brand" />
                Personalización de Marca
            </h2>

            {/* Crop Modal */}
            {imageToCrop && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Crop size={18} /> Recortar Logo
                            </h3>
                            <button onClick={handleCropCancel} className="text-zinc-400 hover:text-zinc-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="relative w-full h-80 bg-zinc-100 dark:bg-zinc-800">
                            <Cropper
                                image={imageToCrop}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="rect"
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>

                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <label className="text-xs font-medium text-zinc-500 mb-1 block">Zoom</label>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.05}
                                    value={zoom}
                                    onChange={e => setZoom(Number(e.target.value))}
                                    className="w-full accent-brand"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCropCancel}
                                    className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCropConfirm}
                                    className="flex-1 px-4 py-2.5 bg-brand hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Check size={16} /> Aplicar Recorte
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Logo Section */}
                <div>
                    <label className="block text-sm font-medium mb-3">Logo de la Organización</label>

                    {/* Preview */}
                    <div className="mb-4 p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg flex flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 min-h-[160px]">
                        {logo ? (
                            <>
                                <img
                                    src={logo}
                                    alt="Logo preview"
                                    className="max-h-24 max-w-full object-contain"
                                />
                                <button
                                    onClick={handleRemoveLogo}
                                    className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                                >
                                    <X size={12} /> Quitar logo
                                </button>
                            </>
                        ) : (
                            <>
                                <ImageIcon size={40} className="text-zinc-300 dark:text-zinc-600" />
                                <p className="text-sm text-zinc-400">Sin logo personalizado</p>
                            </>
                        )}
                    </div>

                    {/* Upload buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <Upload size={14} /> Subir Imagen
                        </button>
                        <button
                            onClick={() => setShowUrlInput(!showUrlInput)}
                            className={`flex-1 px-3 py-2 border rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${showUrlInput ? 'border-brand text-brand bg-brand/5' : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                        >
                            <Link2 size={14} /> Usar URL
                        </button>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {/* URL Input */}
                    {showUrlInput && (
                        <div className="mt-3 flex gap-2">
                            <input
                                type="url"
                                placeholder="https://mi-empresa.com/logo.png"
                                value={urlValue}
                                onChange={e => setUrlValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
                                className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 focus:border-brand outline-none"
                                autoFocus
                            />
                            <button
                                onClick={handleUrlSubmit}
                                className="px-3 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                            >
                                Aplicar
                            </button>
                        </div>
                    )}

                    <p className="mt-2 text-xs text-zinc-400">PNG, JPG o SVG. Máximo 500KB. Se recortará a formato cuadrado.</p>
                </div>

                {/* Color Section */}
                <div>
                    <label className="block text-sm font-medium mb-3">Color Principal</label>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                            <input
                                type="color"
                                value={brandColor}
                                onChange={e => setBrandColor(e.target.value)}
                                className="w-16 h-16 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 cursor-pointer"
                                style={{ padding: 2 }}
                            />
                        </div>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={brandColor}
                                onChange={e => {
                                    const v = e.target.value;
                                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setBrandColor(v);
                                }}
                                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-mono bg-white dark:bg-zinc-900 focus:border-brand outline-none uppercase"
                                placeholder="#E0A641"
                            />
                            {brandColor !== DEFAULT_COLOR && (
                                <button
                                    onClick={() => setBrandColor(DEFAULT_COLOR)}
                                    className="mt-2 text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1 transition-colors"
                                >
                                    <RotateCcw size={10} /> Restaurar color original
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                        <p className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wider">Vista Previa</p>
                        <div className="flex items-center gap-3 mb-3">
                            {logo ? (
                                <img src={logo} alt="Logo" className="h-8 object-contain" />
                            ) : (
                                <div className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: brandColor }}>
                                    {orgName.charAt(0)}
                                </div>
                            )}
                            <span className="font-semibold text-sm">{orgName}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="px-3 py-1.5 rounded text-xs text-white font-medium"
                                style={{ backgroundColor: brandColor }}
                            >
                                Botón Primario
                            </button>
                            <button
                                className="px-3 py-1.5 rounded text-xs font-medium border"
                                style={{ borderColor: brandColor, color: brandColor }}
                            >
                                Botón Secundario
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`mt-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
                    {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
                    {message.text}
                </div>
            )}

            {/* Save */}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className="px-6 py-2.5 bg-brand hover:bg-amber-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    {saving ? 'Guardando...' : 'Guardar Marca'}
                </button>
            </div>
        </div>
    );
}

// Utility: crop image and return base64
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Output 256x256 for consistent logo size
    const outputSize = 256;
    canvas.width = outputSize;
    canvas.height = outputSize;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputSize,
        outputSize,
    );

    return canvas.toDataURL('image/png', 0.9);
}

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', reject);
        image.crossOrigin = 'anonymous';
        image.src = url;
    });
}
