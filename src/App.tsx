import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useInvoiceWizard } from './hooks/useInvoiceWizard';
import { useSavedInvoices } from './hooks/useSavedInvoices';
import { ProfileStep } from './components/wizard/ProfileStep';
import { ClientStep } from './components/wizard/ClientStep';
import { ItemsStep } from './components/wizard/ItemsStep';
import { ReviewStep } from './components/wizard/ReviewStep';
import { AIAssistantModal } from './components/ui/AIAssistantModal';
import { PhotoWizardModal } from './components/ui/PhotoWizardModal';
import { Dashboard } from './components/Dashboard';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Wand2, Camera, FileText, CheckCircle2, LayoutDashboard, WifiOff } from 'lucide-react';
import { InvoiceItem, Invoice } from './schemas/invoice.schema';
import { Button } from './components/ui/Button';

function WizardApp() {
  const [view, setView] = useState<'dashboard' | 'wizard'>(() => {
    return (localStorage.getItem('proinvoice_view') as 'dashboard' | 'wizard') || 'dashboard';
  });
  
  useEffect(() => {
    localStorage.setItem('proinvoice_view', view);
  }, [view]);

  const wizard = useInvoiceWizard();
  const { savedInvoices, saveInvoice, deleteInvoice } = useSavedInvoices();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const isOnline = useOnlineStatus();

  const handleAIApply = (data: { clientName?: string; clientAddress?: string; jobNumber?: string; taxRate?: number; items?: InvoiceItem[] }) => {
    if (data.clientName || data.clientAddress || data.jobNumber || data.taxRate !== undefined) {
      wizard.setClient({
        ...wizard.client,
        clientName: data.clientName || wizard.client.clientName,
        clientAddress: data.clientAddress || wizard.client.clientAddress,
        jobNumber: data.jobNumber || wizard.client.jobNumber,
        taxRate: data.taxRate !== undefined ? data.taxRate : wizard.client.taxRate,
      });
    }
    if (data.items && data.items.length > 0) {
      wizard.setItems([...wizard.items, ...data.items]);
    }
    
    // Auto-advance to items if we got items, otherwise client
    if (data.items && data.items.length > 0) {
      wizard.setStep('items');
    } else if (data.clientName) {
      wizard.setStep('client');
    }
  };

  const steps = [
    { id: 'profile', label: 'Profile' },
    { id: 'client', label: 'Client' },
    { id: 'items', label: 'Items' },
    { id: 'review', label: 'Review' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === wizard.step);

  const handleSaveInvoice = () => {
    saveInvoice(wizard.getFullInvoice());
    wizard.incrementInvoiceSequence(); // Increment sequence for next time
    wizard.clearDraft(); // Clear the draft since it's saved
    wizard.resetDraft(); // Reset state so next invoice is fresh
    setView('dashboard');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    wizard.loadInvoice(invoice);
    setView('wizard');
  };

  const handleNewInvoice = () => {
    wizard.resetDraft();
    setView('wizard');
  };

  const handleResumeDraft = () => {
    setView('wizard');
  };

  return (
    <div className="min-h-screen flex flex-col print:bg-white print:block bg-slate-50">
      {/* Header (Hidden in print) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            className="flex items-center gap-2 text-indigo-600 font-bold text-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1" 
            onClick={() => setView('dashboard')}
            aria-label="Go to Dashboard"
          >
            <FileText className="w-6 h-6" aria-hidden="true" />
            <span>Invoice Pro</span>
            {!isOnline && (
              <span className="ml-2 flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                <WifiOff className="w-3 h-3" />
                Offline
              </span>
            )}
          </button>
          
          <div className="flex items-center gap-2">
            {view === 'wizard' && wizard.step !== 'review' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsPhotoModalOpen(true)}
                  disabled={!isOnline}
                  title={!isOnline ? "AI features require an internet connection" : "Extract details from a photo"}
                  className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed px-2 sm:px-3"
                >
                  <Camera className="w-4 h-4 sm:mr-2" aria-hidden="true" />
                  <span className="hidden sm:inline">Photo</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsAIModalOpen(true)}
                  disabled={!isOnline}
                  title={!isOnline ? "AI features require an internet connection" : "Extract details with AI"}
                  className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed px-2 sm:px-3"
                >
                  <Wand2 className="w-4 h-4 sm:mr-2" aria-hidden="true" />
                  <span className="hidden sm:inline">Magic Wand</span>
                </Button>
              </>
            )}
            {view === 'wizard' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setView('dashboard')}
                className="text-slate-600 border-slate-200 hover:bg-slate-50"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Progress Bar (Hidden in print) */}
      {view === 'wizard' && wizard.step !== 'review' && (
        <div className="bg-white border-b border-slate-100 print:hidden">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between max-w-md mx-auto relative" aria-label="Progress">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full" aria-hidden="true"></div>
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-300"
                style={{ width: `${(currentStepIndex / (steps.length - 2)) * 100}%` }}
                aria-hidden="true"
              ></div>
              
              {steps.slice(0, 3).map((s, i) => {
                const isCompleted = currentStepIndex > i;
                const isCurrent = currentStepIndex === i;
                
                return (
                  <div key={s.id} className="flex flex-col items-center gap-2 bg-white px-2" aria-current={isCurrent ? 'step' : undefined}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      isCompleted ? 'bg-indigo-600 text-white' : 
                      isCurrent ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-600' : 
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> : i + 1}
                    </div>
                    <span className={`text-xs font-medium ${isCurrent ? 'text-indigo-700' : 'text-slate-500'}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 print:p-0">
        {view === 'dashboard' ? (
          <Dashboard 
            invoices={savedInvoices} 
            onNewInvoice={handleNewInvoice} 
            onEditInvoice={handleEditInvoice} 
            onDeleteInvoice={deleteInvoice} 
            hasDraft={wizard.hasDraft}
            onResumeDraft={handleResumeDraft}
          />
        ) : (
          <div className={`max-w-5xl mx-auto ${wizard.step === 'review' ? 'print:visible' : ''}`}>
            {wizard.step === 'profile' && (
              <ProfileStep 
                profile={wizard.profile} 
                setProfile={wizard.setProfile} 
                onNext={wizard.nextStep} 
              />
            )}
            {wizard.step === 'client' && (
              <ClientStep 
                client={wizard.client} 
                setClient={wizard.setClient} 
                date={wizard.date}
                setDate={wizard.setDate}
                dueDate={wizard.dueDate}
                setDueDate={wizard.setDueDate}
                onNext={wizard.nextStep} 
                onPrev={wizard.prevStep} 
              />
            )}
            {wizard.step === 'items' && (
              <ItemsStep 
                items={wizard.items} 
                setItems={wizard.setItems} 
                currency={wizard.profile.currency}
                onNext={wizard.nextStep} 
                onPrev={wizard.prevStep} 
              />
            )}
            {wizard.step === 'review' && (
              <div className="space-y-6">
                <ReviewStep 
                  invoice={wizard.getFullInvoice()} 
                  onPrev={wizard.prevStep} 
                  onNew={handleNewInvoice} 
                />
                <div className="w-full max-w-3xl mx-auto flex justify-end print:hidden">
                  <Button onClick={handleSaveInvoice} size="lg" className="w-full sm:w-auto">
                    Save to Dashboard
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <AIAssistantModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        onApply={handleAIApply} 
      />
      <PhotoWizardModal 
        isOpen={isPhotoModalOpen} 
        onClose={() => setIsPhotoModalOpen(false)} 
        onApply={handleAIApply} 
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary name="Root">
      <WizardApp />
    </ErrorBoundary>
  );
}
