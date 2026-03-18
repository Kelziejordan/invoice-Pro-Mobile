import { useState, useCallback, useEffect } from 'react';
import { Invoice, InvoiceSchema } from '../schemas/invoice.schema';
import { z } from 'zod';

const STORAGE_KEY = 'proinvoice_history';

export function useSavedInvoices() {
  const [savedInvoices, setSavedInvoices] = useState<Invoice[]>([]);

  // Load and validate saved invoices on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Mandate 8: Zero-Trust Data Boundaries
        const validationResult = z.array(InvoiceSchema).safeParse(parsed);
        
        if (validationResult.success) {
          setSavedInvoices(validationResult.data);
        } else {
          console.error('Failed to validate saved invoices from local storage:', validationResult.error);
          // If data is corrupted, we don't crash, we just load what we can or start fresh.
          // In a production app, we might want to migrate or recover data here.
        }
      } catch (e) {
        console.error('Failed to parse saved invoices JSON', e);
      }
    }
  }, []);

  const saveInvoice = useCallback((invoice: Invoice) => {
    setSavedInvoices((prev) => {
      const existingIndex = prev.findIndex(i => i.id === invoice.id);
      
      let newInvoices: Invoice[];
      if (existingIndex >= 0) {
        newInvoices = [...prev];
        newInvoices[existingIndex] = invoice;
      } else {
        // Ensure ID exists
        const invoiceToSave = { ...invoice, id: invoice.id || crypto.randomUUID() };
        newInvoices = [invoiceToSave, ...prev];
      }
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newInvoices));
      } catch (e) {
        // Handle QuotaExceededError
        console.error('Failed to save invoice to local storage. Quota may be exceeded.', e);
        alert('Failed to save invoice. Your local storage might be full. Try deleting old invoices or using a smaller logo image.');
      }
      
      return newInvoices;
    });
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    setSavedInvoices((prev) => {
      const newInvoices = prev.filter(i => i.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newInvoices));
      } catch (e) {
        console.error('Failed to update local storage after deletion', e);
      }
      return newInvoices;
    });
  }, []);

  return {
    savedInvoices,
    saveInvoice,
    deleteInvoice,
  };
}
