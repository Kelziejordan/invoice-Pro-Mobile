import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Loader2, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';
import { usePhotoWizard } from '../../hooks/usePhotoWizard';
import { AIInvoiceExtraction, InvoiceItem } from '../../schemas/invoice.schema';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: { clientName?: string; clientAddress?: string; jobNumber?: string; taxRate?: number; items?: InvoiceItem[] }) => void;
}

export function PhotoWizardModal({ isOpen, onClose, onApply }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state, extractFromPhoto, reset } = usePhotoWizard();

  useEffect(() => {
    if (isOpen) {
      setSelectedImage(null);
      setMimeType('');
      reset();
    }
  }, [isOpen, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSelectedImage(base64String);
      setMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = () => {
    if (!selectedImage || !mimeType) return;
    extractFromPhoto(selectedImage, mimeType);
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
      jobNumber: data.jobNumber,
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
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white rounded-3xl shadow-2xl z-50 overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="photo-modal-title"
          >
            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3 text-indigo-600">
                  <div className="p-2 bg-indigo-50 rounded-xl" aria-hidden="true">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h2 id="photo-modal-title" className="text-xl font-bold text-slate-900">Photo Wizard</h2>
                </div>
                <button 
                  onClick={onClose} 
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {state.status === 'idle' && (
                <div className="space-y-6">
                  <p className="text-slate-600 text-sm">
                    Take a picture or upload an image of a document, receipt, or notes. We'll extract the details to pre-fill your invoice.
                  </p>
                  
                  {!selectedImage ? (
                    <div 
                      className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-700 font-medium mb-1">Click to upload or take a photo</p>
                      <p className="text-slate-500 text-sm">Supports JPG, PNG, WEBP</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center h-48">
                        <img src={selectedImage} alt="Selected document" className="max-h-full max-w-full object-contain" />
                        <button 
                          onClick={() => setSelectedImage(null)}
                          className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-slate-700 hover:bg-white shadow-sm"
                          aria-label="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <Button className="w-full" onClick={handleExtract}>
                        Extract Information
                      </Button>
                    </div>
                  )}
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>
              )}

              {state.status === 'loading' && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4" aria-live="polite">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" aria-hidden="true" />
                  <p className="text-slate-600 font-medium animate-pulse">Analyzing image...</p>
                </div>
              )}

              {state.status === 'error' && (
                <div className="py-6 space-y-4" aria-live="assertive">
                  <div className="p-4 bg-red-50 text-red-900 rounded-xl border border-red-100 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-semibold mb-1">Could not parse image data</p>
                      <p className="text-sm opacity-90">{state.error instanceof Error ? state.error.message : String(state.error)}</p>
                    </div>
                  </div>
                  <Button variant="secondary" className="w-full" onClick={reset}>
                    Try Another Photo
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
                      {state.data.jobNumber && (
                        <p><span className="font-medium">Job Number:</span> {state.data.jobNumber}</p>
                      )}
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
                        {(!state.data.items || state.data.items.length === 0) && (
                          <li className="text-emerald-700/70 italic">No items found</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={reset}>Discard</Button>
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent" onClick={() => handleApply(state.data)}>
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
