// filepath: src/components/ai/AIAssistantModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wand2, X, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAIAssistant } from '../../hooks/useAIAssistant';
import { RemoteData } from '../../types/remote-data';
import { AIInvoiceExtraction, InvoiceItem } from '../../schemas/invoice.schema';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: { clientName?: string; clientAddress?: string; taxRate?: number; items?: InvoiceItem[] }) => void;
}

export function AIAssistantModal({ isOpen, onClose, onApply }: Props) {
  const [prompt, setPrompt] = useState('');
  const { state, extractInvoiceData, reset } = useAIAssistant();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      reset();
    }
  }, [isOpen, reset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    extractInvoiceData(prompt);
  };

  const handleApply = (data: AIInvoiceExtraction) => {
    const mappedItems = data.items?.map(item => ({
      id: crypto.randomUUID(),
      description: item.description,
      details: item.details,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    onApply({
      clientName: data.clientName,
      clientAddress: data.clientAddress,
      taxRate: data.taxRate,
      items: mappedItems,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white rounded-3xl shadow-2xl z-50 overflow-hidden border border-slate-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-modal-title"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3 text-indigo-600">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <Wand2 className="w-6 h-6" />
                  </div>
                  <h2 id="ai-modal-title" className="text-xl font-bold text-slate-900">Magic Wand</h2>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {state.status === 'idle' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-slate-600 text-sm">
                    Describe the job naturally. We'll extract the client details and line items for you.
                  </p>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., I did a deep clean for Sarah at 123 Main St for $300, plus $50 for window cleaning."
                    className="w-full h-32 p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none transition-colors"
                    autoFocus
                  />
                  <Button type="submit" className="w-full" disabled={!prompt.trim()}>
                    Generate Invoice Data
                  </Button>
                </form>
              )}

              {state.status === 'loading' && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4" aria-live="polite">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                  <p className="text-slate-600 font-medium animate-pulse">Analyzing your request...</p>
                </div>
              )}

              {state.status === 'error' && (
                <div className="py-6 space-y-4" aria-live="assertive">
                  <div className="p-4 bg-red-50 text-red-900 rounded-xl border border-red-100">
                    <p className="font-semibold mb-1">Could not parse invoice data</p>
                    <p className="text-sm opacity-90">{state.error instanceof Error ? state.error.message : String(state.error)}</p>
                  </div>
                  <Button variant="secondary" className="w-full" onClick={reset}>
                    Try Again
                  </Button>
                </div>
              )}

              {state.status === 'success' && (
                <div className="space-y-6" aria-live="polite">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                    <h3 className="font-semibold text-emerald-900 mb-3">Extracted Data</h3>
                    <div className="space-y-2 text-sm text-emerald-800">
                      <p><span className="font-medium">Client:</span> {state.data.clientName || 'Not found'}</p>
                      <p><span className="font-medium">Address:</span> {state.data.clientAddress || 'Not found'}</p>
                      {state.data.taxRate !== undefined && (
                        <p><span className="font-medium">Tax Rate:</span> {state.data.taxRate}%</p>
                      )}
                      <p className="font-medium mt-2">Items:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {state.data.items?.map((item, i) => (
                          <li key={i}>
                            <span className="font-medium">{item.description}</span> - {item.quantity} x ${item.unitPrice}
                            {item.details && <div className="text-xs opacity-80 mt-0.5">{item.details}</div>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={reset}>Discard</Button>
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApply(state.data)}>
                      Apply to Invoice
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
