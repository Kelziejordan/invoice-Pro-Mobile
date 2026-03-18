import { useState, useCallback, useEffect } from 'react';
import { Invoice } from '../schemas/invoice.schema';

export function useSavedInvoices() {
  const [savedInvoices, setSavedInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('proinvoice_history');
    if (stored) {
      try {
        setSavedInvoices(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse saved invoices', e);
      }
    }
  }, []);

  const saveInvoice = useCallback((invoice: Invoice) => {
    setSavedInvoices((prev) => {
      // Check if invoice already exists (by ID or invoiceNumber)
      const existingIndex = prev.findIndex(i => i.id === invoice.id || i.invoiceNumber === invoice.invoiceNumber);
      
      let newInvoices;
      if (existingIndex >= 0) {
        newInvoices = [...prev];
        newInvoices[existingIndex] = invoice;
      } else {
        // Add new invoice with ID if it doesn't have one
        const invoiceToSave = { ...invoice, id: invoice.id || crypto.randomUUID() };
        newInvoices = [invoiceToSave, ...prev];
      }
      
      localStorage.setItem('proinvoice_history', JSON.stringify(newInvoices));
      return newInvoices;
    });
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    setSavedInvoices((prev) => {
      const newInvoices = prev.filter(i => i.id !== id);
      localStorage.setItem('proinvoice_history', JSON.stringify(newInvoices));
      return newInvoices;
    });
  }, []);

  return {
    savedInvoices,
    saveInvoice,
    deleteInvoice,
  };
}
