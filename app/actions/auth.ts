'use server'

import { prisma } from '@/lib/prisma';
import { login, logout, getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { rateLimit } from '@/lib/rate-limit';

export async function loginAction(data: any) {
    const { email, password } = data;

    // Rate limit: 5 attempts per email per 15 minutes
    const rl = rateLimit(`login:${email}`, 5, 15 * 60_000);
    if (!rl.allowed) {
        return { success: false, error: 'Demasiados intentos. Espera 15 minutos.' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return { success: false, error: 'Credenciales incorrectas' };
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return { success: false, error: 'Credenciales incorrectas' };
        }

        // Create session
        await login({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId
        });

        return { success: true };

    } catch (error) {
        console.error('Login error', error);
        return { success: false, error: 'Error del servidor' };
    }
}

export async function logoutAction() {
    await logout();
    redirect('/login');
}

export async function createUser(data: any) {
    const session = await getSession();
    if (!session?.user?.organizationId) {
        return { success: false, error: 'No autorizado' };
    }

    const { name, email, password, role } = data;

    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return { success: false, error: 'El email ya está registrado' };

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'user',
                organizationId: session.user.organizationId,
            }
        });
        revalidatePath('/settings/users');
        return { success: true };
    } catch (e) {
        return { success: false, error: 'Error al crear usuario' };
    }
}

export async function registerAction(data: {
    organizationName: string;
    name: string;
    email: string;
    password: string;
    licenseCode: string;
}) {
    const { organizationName, name, email, password, licenseCode } = data;

    try {
        // Validate license code exists and is unused
        const license = await prisma.licenseCode.findUnique({
            where: { code: licenseCode }
        });

        if (!license) {
            return { success: false, error: 'Código de licencia inválido' };
        }

        if (license.used) {
            return { success: false, error: 'Este código de licencia ya fue utilizado' };
        }

        // Check email not taken
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return { success: false, error: 'Este email ya está registrado' };
        }

        // Generate slug from org name
        const slug = organizationName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        const existingOrg = await prisma.organization.findUnique({ where: { slug } });
        if (existingOrg) {
            return { success: false, error: 'Ya existe una organización con un nombre similar. Intenta con otro nombre.' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Transaction: create org + user + mark license as used
        const result = await prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: {
                    name: organizationName,
                    slug,
                }
            });

            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: 'admin',
                    organizationId: org.id,
                }
            });

            await tx.licenseCode.update({
                where: { id: license.id },
                data: {
                    used: true,
                    usedAt: new Date(),
                    usedByEmail: email,
                    organizationId: org.id,
                }
            });

            return { org, user };
        });

        // Auto-login
        await login({
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
            organizationId: result.user.organizationId,
        });

        return { success: true };
    } catch (error) {
        console.error('Register error:', error);
        return { success: false, error: 'Error del servidor al registrar' };
    }
}

export async function requestPasswordReset(email: string) {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        // Security: Always return success even if email doesn't exist to prevent enumeration
        if (!user) return { success: true };

        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

        await prisma.passwordResetToken.create({
            data: {
                email,
                token,
                expiresAt
            }
        });

        // MOCK EMAIL SENDING
        console.log(`[EMAIL MOCK] Password Reset Requested for ${email}. Link: ${process.env.APP_URL}/reset-password?token=${token}`);
        console.log(`[EMAIL MOCK] Notification sent to nelsondcarvajal@gmail.com`);

        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Error al procesar solicitud' };
    }
}
