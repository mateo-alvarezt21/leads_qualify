import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'LeadQuality — Calificación Inteligente de Leads';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #09090b 0%, #1c1917 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '80px',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Badge */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: '999px',
                        padding: '6px 20px',
                        marginBottom: '32px',
                    }}
                >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                    <span style={{ color: '#f59e0b', fontSize: 18, fontWeight: 600 }}>
                        Powered by GPT-4o
                    </span>
                </div>

                {/* Title */}
                <div
                    style={{
                        fontSize: 80,
                        fontWeight: 800,
                        color: '#ffffff',
                        lineHeight: 1.1,
                        textAlign: 'center',
                        marginBottom: '24px',
                    }}
                >
                    Lead<span style={{ color: '#f59e0b' }}>Quality</span>
                </div>

                {/* Subtitle */}
                <div
                    style={{
                        fontSize: 30,
                        color: '#a1a1aa',
                        textAlign: 'center',
                        maxWidth: 800,
                        lineHeight: 1.4,
                    }}
                >
                    Califica y gestiona tus leads con Inteligencia Artificial
                </div>

                {/* Stats strip */}
                <div
                    style={{
                        display: 'flex',
                        gap: '48px',
                        marginTop: '60px',
                        padding: '24px 48px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px',
                    }}
                >
                    {[
                        { label: 'Puntuación 0–100', icon: '🎯' },
                        { label: 'Webhook en tiempo real', icon: '⚡' },
                        { label: 'Multi-organización', icon: '🏢' },
                    ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: 24 }}>{item.icon}</span>
                            <span style={{ color: '#d4d4d8', fontSize: 20 }}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        ),
        { ...size },
    );
}
