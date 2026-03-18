import React, { useState, useEffect, useCallback } from 'react';
import { Profile, Client, InvoiceItem, Invoice, ProfileSchema, InvoiceSchema } from '../schemas/invoice.schema';
import { getTodayISODate, getFutureISODate } from '../utils/date';

type WizardStep = 'profile' | 'client' | 'items' | 'review';

const PROFILE_STORAGE_KEY = 'proinvoice_user_profile';
const DRAFT_STORAGE_KEY = 'proinvoice_draft';

const defaultProfile: Profile = {
  companyName: '',
  email: '',
  phone: '',
  address: '',
  gstNumber: '',
  logo: '',
  currency: 'USD',
  taxLabel: 'Tax',
  invoiceConfig: { prefix: 'INV-', nextNumber: 1001 }
};

const defaultClient: Client = {
  clientName: '',
  clientEmail: '',
  clientAddress: '',
  taxRate: 0,
  discount: 0,
  paymentTerms: 'Due on receipt',
  notes: 'Thank you for your business!'
};

export function useInvoiceWizard() {
  const [step, setStep] = useState<WizardStep>('profile');
  
  // State
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [client, setClient] = useState<Client>(defaultClient);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [date, setDate] = useState<string>(getTodayISODate());
  const [dueDate, setDueDate] = useState<string>(getFutureISODate(14));
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [draftId, setDraftId] = useState<string>(crypto.randomUUID());

  // Load saved profile and draft on mount
  useEffect(() => {
    // Load Profile
    const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile);
        const validation = ProfileSchema.safeParse(parsed);
        if (validation.success) {
          setProfile(validation.data);
        }
      } catch (e) {
        console.error('Failed to parse saved profile', e);
      }
    }

    // Load Draft
    const storedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (storedDraft) {
      try {
        const parsed = JSON.parse(storedDraft);
        // We use partial validation here because a draft might be incomplete
        if (parsed.client) setClient(parsed.client);
        if (parsed.items) setItems(parsed.items);
        if (parsed.date) setDate(parsed.date);
        if (parsed.dueDate) setDueDate(parsed.dueDate);
        if (parsed.invoiceNumber) setInvoiceNumber(parsed.invoiceNumber);
        if (parsed.draftId) setDraftId(parsed.draftId);
        if (parsed.step) setStep(parsed.step);
      } catch (e) {
        console.error('Failed to parse saved draft', e);
      }
    }
  }, []);

  // Save profile whenever it changes
  useEffect(() => {
    if (profile.companyName) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }
  }, [profile]);

  // Save draft whenever relevant state changes
  useEffect(() => {
    const draft = { client, items, date, dueDate, invoiceNumber, draftId, step };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [client, items, date, dueDate, invoiceNumber, draftId, step]);

  // Generate invoice number dynamically if empty
  const currentInvoiceNumber = invoiceNumber || `${profile.invoiceConfig.prefix}${profile.invoiceConfig.nextNumber}`;

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

  const getFullInvoice = useCallback((): Invoice => {
    return {
      id: draftId,
      invoiceNumber: currentInvoiceNumber,
      date,
      dueDate,
      profile,
      client,
      items,
    };
  }, [draftId, currentInvoiceNumber, date, dueDate, profile, client, items]);

  const incrementInvoiceSequence = useCallback(() => {
    setProfile(prev => ({
      ...prev,
      invoiceConfig: {
        ...prev.invoiceConfig,
        nextNumber: prev.invoiceConfig.nextNumber + 1
      }
    }));
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  }, []);

  const resetDraft = useCallback(() => {
    setClient(defaultClient);
    setItems([]);
    setDate(getTodayISODate());
    setDueDate(getFutureISODate(14));
    setInvoiceNumber('');
    setDraftId(crypto.randomUUID());
    setStep('client'); // Skip profile step on new invoices since it's saved
    clearDraft();
  }, [clearDraft]);

  // Method to load an existing invoice for editing
  const loadInvoice = useCallback((invoice: Invoice) => {
    setProfile(invoice.profile);
    setClient(invoice.client);
    setItems(invoice.items);
    setDate(invoice.date);
    setDueDate(invoice.dueDate);
    setInvoiceNumber(invoice.invoiceNumber);
    setDraftId(invoice.id || crypto.randomUUID());
    setStep('review');
  }, []);

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
    
    date,
    setDate,
    
    dueDate,
    setDueDate,
    
    invoiceNumber: currentInvoiceNumber,
    setInvoiceNumber,
    
    getFullInvoice,
    incrementInvoiceSequence,
    resetDraft,
    loadInvoice,
    clearDraft
  };
}
