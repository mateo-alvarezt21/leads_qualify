import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: '#e0a641',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '38px',
                    fontFamily: 'sans-serif',
                }}
            >
                <span
                    style={{
                        color: '#ffffff',
                        fontSize: 80,
                        fontWeight: 800,
                        letterSpacing: '-3px',
                        lineHeight: 1,
                    }}
                >
                    LQ
                </span>
            </div>
        ),
        { ...size },
    );
}
