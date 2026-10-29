import { useState, useEffect, useCallback } from 'react';
import { Profile, Client, InvoiceItem, Invoice, ProfileSchema } from '../schemas/invoice.schema';
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
  currency: 'CAD',
  taxLabel: 'GST',
  invoiceConfig: { prefix: 'INV-', nextNumber: 1001 }
};

const defaultClient: Client = {
  clientName: '',
  clientEmail: '',
  clientAddress: '',
  taxRate: 5,
  discount: 0,
  paymentTerms: 'Due on receipt',
  notes: 'Thank you for your business!'
};

function getInitialProfile(): Profile {
  if (typeof window === 'undefined') return defaultProfile;
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const validation = ProfileSchema.safeParse(parsed);
      if (validation.success) return validation.data;
    }
  } catch (error) {
    console.error('Failed to load business profile from local storage.', error);
  }
  return defaultProfile;
}

function getInitialDraft() {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse draft', error);
    }
  }
  return null;
}

export function useInvoiceWizard() {
  const [initialDraft] = useState(getInitialDraft);

  const [step, setStep] = useState<WizardStep>(initialDraft?.step || 'profile');
  const [profile, setProfile] = useState<Profile>(getInitialProfile);
  const [client, setClient] = useState<Client>(initialDraft?.client || defaultClient);
  const [items, setItems] = useState<InvoiceItem[]>(initialDraft?.items || []);
  const [date, setDate] = useState<string>(initialDraft?.date || getTodayISODate());
  const [dueDate, setDueDate] = useState<string>(initialDraft?.dueDate || getFutureISODate(14));
  const [invoiceNumber, setInvoiceNumber] = useState<string>(initialDraft?.invoiceNumber || '');
  const [draftId, setDraftId] = useState<string>(initialDraft?.draftId || crypto.randomUUID());

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save business profile. Export a backup and check device storage.', error);
    }
  }, [profile]);

  useEffect(() => {
    const draft = { client, items, date, dueDate, invoiceNumber, draftId, step };
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
      console.error('Failed to save invoice draft. Export existing invoices and check device storage.', error);
    }
  }, [client, items, date, dueDate, invoiceNumber, draftId, step]);

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

  const getFullInvoice = useCallback((): Invoice => ({
    id: draftId,
    invoiceNumber: currentInvoiceNumber,
    date,
    dueDate,
    profile,
    client,
    items,
  }), [draftId, currentInvoiceNumber, date, dueDate, profile, client, items]);

  const incrementInvoiceSequence = useCallback(() => {
    setProfile(prev => ({
      ...prev,
      invoiceConfig: { ...prev.invoiceConfig, nextNumber: prev.invoiceConfig.nextNumber + 1 }
    }));
  }, []);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear invoice draft from local storage.', error);
    }
  }, []);

  const resetDraft = useCallback(() => {
    setClient(defaultClient);
    setItems([]);
    setDate(getTodayISODate());
    setDueDate(getFutureISODate(14));
    setInvoiceNumber('');
    setDraftId(crypto.randomUUID());
    setStep(profile.companyName ? 'client' : 'profile');
    clearDraft();
  }, [clearDraft, profile.companyName]);

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

  const hasDraft = client.clientName !== '' || items.length > 0;

  return {
    step, setStep, nextStep, prevStep,
    profile, setProfile,
    client, setClient,
    items, setItems,
    date, setDate,
    dueDate, setDueDate,
    invoiceNumber: currentInvoiceNumber, setInvoiceNumber,
    getFullInvoice, incrementInvoiceSequence, resetDraft, loadInvoice, clearDraft,
    hasDraft
  };
}
