// filepath: src/hooks/useInvoiceWizard.ts
import { useState, useCallback } from 'react';
import { z } from 'zod';
import { usePersistentData } from './usePersistentData';
import { ProfileSchema, Profile, ClientSchema, Client, InvoiceItemSchema, InvoiceItem, Invoice } from '../schemas/invoice.schema';
import { getTodayISODate, getFutureISODate } from '../utils/date';

export type WizardStep = 'profile' | 'client' | 'items' | 'review';

export function useInvoiceWizard() {
  const [step, setStep] = usePersistentData<WizardStep>('proinvoice_step', z.enum(['profile', 'client', 'items', 'review']), 'profile');

  // Persistent Profile Data
  const [profile, setProfile] = usePersistentData<Profile>('proinvoice_profile', ProfileSchema, {
    companyName: '',
    address: '',
    email: '',
    phone: '',
    gstNumber: '',
    logo: '',
    currency: 'USD',
    taxLabel: 'Tax',
  });

  // Session Draft Data (Client & Items)
  const [client, setClient] = usePersistentData<Client>('proinvoice_client', ClientSchema, {
    clientName: '',
    clientAddress: '',
    clientEmail: '',
    taxRate: 0,
    paymentTerms: '',
    notes: '',
  });

  const [items, setItems] = usePersistentData<InvoiceItem[]>('proinvoice_items', z.array(InvoiceItemSchema), []);
  const [invoiceNumber, setInvoiceNumber] = usePersistentData<string>('proinvoice_number', z.string(), `INV-${Math.floor(Math.random() * 10000)}`);
  const [date, setDate] = usePersistentData<string>('proinvoice_date', z.string(), getTodayISODate());
  const [dueDate, setDueDate] = usePersistentData<string>('proinvoice_duedate', z.string(), getFutureISODate(14));

  const nextStep = useCallback(() => {
    setStep((current) => {
      if (current === 'profile') return 'client';
      if (current === 'client') return 'items';
      if (current === 'items') return 'review';
      return current;
    });
  }, []);

  const prevStep = useCallback(() => {
    setStep((current) => {
      if (current === 'review') return 'items';
      if (current === 'items') return 'client';
      if (current === 'client') return 'profile';
      return current;
    });
  }, []);

  const resetDraft = useCallback(() => {
    setClient({ clientName: '', clientAddress: '', clientEmail: '', taxRate: 0, paymentTerms: '', notes: '' });
    setItems([]);
    setInvoiceNumber(`INV-${Math.floor(Math.random() * 10000)}`);
    setDate(getTodayISODate());
    setDueDate(getFutureISODate(14));
    setStep('client'); // Usually reset to client step after finishing one
  }, []);

  const getFullInvoice = useCallback((): Invoice => {
    return {
      profile,
      client,
      items,
      invoiceNumber,
      date,
      dueDate,
    };
  }, [profile, client, items, invoiceNumber, date, dueDate]);

  return {
    step,
    setStep,
    nextStep,
    prevStep,
    profile,
    setProfile,
    client,
    setClient,
    items,
    setItems,
    invoiceNumber,
    setInvoiceNumber,
    date,
    setDate,
    dueDate,
    setDueDate,
    resetDraft,
    getFullInvoice,
  };
}
