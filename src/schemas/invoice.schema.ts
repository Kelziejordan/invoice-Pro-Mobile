// filepath: src/schemas/invoice.schema.ts
import { z } from 'zod';

export const ProfileSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  address: z.string().min(1, 'Address is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  gstNumber: z.string().optional(),
  logo: z.string().optional(), // Base64 string
  currency: z.string().default('USD'),
  taxLabel: z.string().default('Tax'),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const ClientSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  clientAddress: z.string().optional(),
  clientEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  taxRate: z.number().min(0).max(100).default(0), // e.g., 10 for 10% GST
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

export type Client = z.infer<typeof ClientSchema>;

export const InvoiceItemSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1, 'Description is required'),
  details: z.string().optional(),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
});

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

export const InvoiceSchema = z.object({
  id: z.string().uuid().optional(),
  profile: ProfileSchema,
  client: ClientSchema,
  items: z.array(InvoiceItemSchema),
  invoiceNumber: z.string().min(1),
  date: z.string(),
  dueDate: z.string(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

// Schema for Gemini AI response parsing
export const AIInvoiceExtractionSchema = z.object({
  clientName: z.string().optional(),
  clientAddress: z.string().optional(),
  taxRate: z.number().optional(),
  items: z.array(
    z.object({
      description: z.string(),
      details: z.string().optional(),
      quantity: z.number(),
      unitPrice: z.number(),
    })
  ).optional(),
});

export type AIInvoiceExtraction = z.infer<typeof AIInvoiceExtractionSchema>;
