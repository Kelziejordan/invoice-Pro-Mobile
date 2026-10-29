import { z } from 'zod';
import { Invoice, InvoiceSchema, Profile, ProfileSchema } from '../schemas/invoice.schema';

export const PROFILE_STORAGE_KEY = 'proinvoice_user_profile';
export const INVOICES_STORAGE_KEY = 'proinvoice_history';

const BackupSchema = z.object({
  format: z.literal('invoice-pro-backup'),
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  profile: ProfileSchema,
  invoices: z.array(InvoiceSchema),
});

export type InvoiceBackup = z.infer<typeof BackupSchema>;

export function createBackup(profile: Profile, invoices: Invoice[], exportedAt = new Date().toISOString()): InvoiceBackup {
  return BackupSchema.parse({
    format: 'invoice-pro-backup',
    version: 1,
    exportedAt,
    profile: ProfileSchema.parse(profile),
    invoices: z.array(InvoiceSchema).parse(invoices),
  });
}

export function parseBackup(serialized: string): InvoiceBackup {
  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    throw new Error('This file is not valid JSON. Choose an Invoice Pro backup file.');
  }

  const result = BackupSchema.safeParse(value);
  if (!result.success) {
    throw new Error('The backup is invalid or uses an unsupported version. No data was changed.');
  }
  return result.data;
}

type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function restoreBackup(backup: InvoiceBackup, storage: StoragePort): void {
  const validated = BackupSchema.parse(backup);
  const previousProfile = storage.getItem(PROFILE_STORAGE_KEY);
  const previousInvoices = storage.getItem(INVOICES_STORAGE_KEY);

  try {
    storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(validated.profile));
    storage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(validated.invoices));
  } catch {
    try {
      if (previousProfile === null) storage.removeItem(PROFILE_STORAGE_KEY);
      else storage.setItem(PROFILE_STORAGE_KEY, previousProfile);
      if (previousInvoices === null) storage.removeItem(INVOICES_STORAGE_KEY);
      else storage.setItem(INVOICES_STORAGE_KEY, previousInvoices);
    } catch {
      throw new Error('Restore failed and rollback could not be completed. Do not close this app; export any remaining data before retrying.');
    }
    throw new Error('Restore failed. Existing data was preserved; check available device storage and try again.');
  }
}
