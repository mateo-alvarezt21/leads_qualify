import { z } from 'zod';

export const LeadSchema = z.object({
    source: z.string().min(1, "Source is required").optional(), // Optional in body as it can be in query param
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format").optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    company: z.string().optional().or(z.literal('')),
    role: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
}).passthrough(); // Allow other extra fields in rawData

export type LeadInput = z.infer<typeof LeadSchema>;
