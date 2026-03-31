import { z } from 'zod';

export const InvoiceItemSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1, "Description is required"),
  details: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be positive"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
});

export const InvoiceConfigSchema = z.object({
  prefix: z.string().default('INV-'),
  nextNumber: z.number().min(1).default(1001),
});

export const ProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  logo: z.string().optional(), // base64 string
  currency: z.string().default('USD'),
  taxLabel: z.string().default('Tax'),
  invoiceConfig: InvoiceConfigSchema.default({ prefix: 'INV-', nextNumber: 1001 }),
});

export const ClientSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Invalid email").optional().or(z.literal('')),
  clientAddress: z.string().optional(),
  taxRate: z.number().min(0).max(100).default(0),
  discount: z.number().min(0).default(0),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

export const InvoiceSchema = z.object({
  id: z.string().uuid().optional(),
  invoiceNumber: z.string(),
  date: z.string(),
  dueDate: z.string(),
  profile: ProfileSchema,
  client: ClientSchema,
  items: z.array(InvoiceItemSchema),
});

export const AIInvoiceExtractionSchema = z.object({
  clientName: z.string().optional(),
  clientAddress: z.string().optional(),
  taxRate: z.number().optional(),
  items: z.array(z.object({
    description: z.string(),
    details: z.string().optional(),
    quantity: z.number(),
    unitPrice: z.number(),
  })).optional(),
});

export const AIAuditSchema = z.object({
  isPerfect: z.boolean(),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type Client = z.infer<typeof ClientSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
export type AIInvoiceExtraction = z.infer<typeof AIInvoiceExtractionSchema>;
export type AIAudit = z.infer<typeof AIAuditSchema>;
export type InvoiceConfig = z.infer<typeof InvoiceConfigSchema>;
