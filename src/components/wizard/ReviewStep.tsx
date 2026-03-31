import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Invoice } from '../../schemas/invoice.schema';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { calculateSubtotal, calculateTax, calculateTotal } from '../../utils/calculations';
import { Download, ArrowLeft, Loader2, AlertTriangle, Sparkles, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ErrorBoundary } from '../ErrorBoundary';
import { useAIAudit } from '../../hooks/useAIAudit';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface Props {
  invoice: Invoice;
  onPrev: () => void;
  onNew: () => void;
}

function ReviewStepContent({ invoice, onPrev, onNew }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOnline = useOnlineStatus();
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(isOnline);
  const { auditState, auditInvoice } = useAIAudit();

  // Trigger audit on mount
  useEffect(() => {
    if (auditState.status === 'idle' && isOnline) {
      auditInvoice(invoice);
    } else if (!isOnline && auditState.status === 'idle') {
      setIsAuditModalOpen(false);
    }
  }, [auditInvoice, invoice, auditState.status, isOnline]);

  const handleCloseAudit = () => {
    setIsAuditModalOpen(false);
  };

  const subtotal = calculateSubtotal(invoice.items);
  const tax = calculateTax(subtotal, invoice.client.taxRate);
  const total = calculateTotal(subtotal, tax, invoice.client.discount);
  const currency = invoice.profile.currency || 'USD';

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Temporarily adjust styles for better PDF rendering
      const element = invoiceRef.current;
      const originalWidth = element.style.width;
      element.style.width = '800px'; // Fixed width for consistent PDF output

      const canvas = await html2canvas(element, {
        scale: 1.5, // Lower resolution to prevent memory limits
        useCORS: true, 
        allowTaint: true, // Allow tainted canvas for data URIs
        logging: false,
        backgroundColor: '#ffffff',
      });

      element.style.width = originalWidth; // Restore original width

      const imgData = canvas.toDataURL('image/png');
      
      // A4 dimensions in mm: 210 x 297
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${invoice.invoiceNumber}.pdf`);
      
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setError('Failed to generate PDF. Please try again or check if your logo image is accessible.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* AI Audit Modal Overlay */}
      <AnimatePresence>
        {isAuditModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 print:hidden"
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white rounded-3xl shadow-2xl z-50 overflow-hidden border border-slate-200 print:hidden flex flex-col max-h-[90vh]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="audit-modal-title"
            >
              <div className="p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3 text-indigo-600">
                    <div className="p-2 bg-indigo-50 rounded-xl" aria-hidden="true">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h2 id="audit-modal-title" className="text-xl font-bold text-slate-900">AI Invoice Audit</h2>
                  </div>
                  <button 
                    onClick={handleCloseAudit} 
                    className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label="Close audit"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                {auditState.status === 'loading' && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center" aria-live="polite">
                    <div className="relative">
                      <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
                      <div className="relative bg-indigo-50 p-4 rounded-full">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" aria-hidden="true" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Reviewing your invoice...</h3>
                      <p className="text-slate-500 text-sm max-w-[250px] mx-auto">Checking for logical errors, missing information, and inconsistencies.</p>
                    </div>
                    <Button variant="ghost" onClick={handleCloseAudit} className="mt-4 text-slate-500">
                      Skip Audit
                    </Button>
                  </div>
                )}

                {auditState.status === 'error' && (
                  <div className="py-6 space-y-6 text-center" aria-live="assertive">
                    <div className="inline-flex bg-red-50 p-4 rounded-full mb-2">
                      <AlertTriangle className="w-8 h-8 text-red-600" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Audit Failed</h3>
                      <p className="text-slate-500 text-sm mb-2">We couldn't complete the AI audit at this time. You can safely skip this step.</p>
                      <p className="text-red-500 text-xs font-mono bg-red-50 p-2 rounded-lg inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap" title={auditState.error.message}>
                        {auditState.error.message}
                      </p>
                    </div>
                    <Button variant="secondary" className="w-full" onClick={handleCloseAudit}>
                      Skip Audit
                    </Button>
                  </div>
                )}

                {auditState.status === 'success' && (
                  <div className="space-y-6" aria-live="polite">
                    {auditState.data.isPerfect ? (
                      <div className="text-center py-6 space-y-6">
                        <div className="inline-flex bg-emerald-50 p-4 rounded-full mb-2">
                          <CheckCircle2 className="w-12 h-12 text-emerald-600" aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-2">Looks Perfect!</h3>
                          <p className="text-slate-500">No logical errors or missing information detected. Your invoice is ready to go.</p>
                        </div>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCloseAudit}>
                          Continue to Invoice
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                          <div className="flex items-center gap-3 mb-4 border-b border-amber-200/50 pb-4">
                            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                            <h3 className="text-lg font-bold text-amber-900">Audit Insights</h3>
                          </div>
                          
                          <div className="space-y-5">
                            {auditState.data.warnings.length > 0 && (
                              <div>
                                <h4 className="text-sm font-bold flex items-center gap-1.5 text-red-700 mb-2 uppercase tracking-wider">
                                  Critical Warnings
                                </h4>
                                <ul className="list-disc list-outside ml-5 text-sm space-y-2 text-red-800">
                                  {auditState.data.warnings.map((w, i) => <li key={i} className="leading-relaxed">{w}</li>)}
                                </ul>
                              </div>
                            )}
                            
                            {auditState.data.suggestions.length > 0 && (
                              <div>
                                <h4 className="text-sm font-bold flex items-center gap-1.5 text-amber-800 mb-2 uppercase tracking-wider">
                                  Suggestions
                                </h4>
                                <ul className="list-disc list-outside ml-5 text-sm space-y-2 text-amber-900">
                                  {auditState.data.suggestions.map((s, i) => <li key={i} className="leading-relaxed">{s}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button className="w-full" onClick={handleCloseAudit}>
                          Acknowledge & Continue
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 print:hidden">
        <Button variant="ghost" onClick={onPrev} className="w-full sm:w-auto">
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" /> Edit Details
        </Button>
        
        {error && (
          <div className="flex items-center text-red-600 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <div className="flex gap-3 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={() => window.print()} 
            className="w-full sm:w-auto bg-white"
          >
            Print
          </Button>
          <Button 
            onClick={handleDownloadPDF} 
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
            )}
            {isGenerating ? 'Generating PDF...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Invoice Document (Printable Area) */}
      <Card className="shadow-none border-0 print:border-0 print:shadow-none print:w-full print:max-w-none overflow-hidden">
        <CardContent className="p-8 sm:p-12 bg-white">
          <div ref={invoiceRef} className="bg-white text-slate-900">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
              <div className="flex gap-6 items-start">
                {invoice.profile.logo && (
                  <div className="w-24 h-24 flex-shrink-0">
                    <img src={invoice.profile.logo} alt="Company Logo" className="w-full h-full object-contain object-left-top" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{invoice.profile.companyName || 'Your Company'}</h1>
                  {invoice.profile.address && <p className="text-slate-500 whitespace-pre-wrap">{invoice.profile.address}</p>}
                  {invoice.profile.email && <p className="text-slate-500">{invoice.profile.email}</p>}
                  {invoice.profile.phone && <p className="text-slate-500">{invoice.profile.phone}</p>}
                  {invoice.profile.gstNumber && <p className="text-slate-500 mt-2">GST: {invoice.profile.gstNumber}</p>}
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-light text-indigo-600 mb-4">INVOICE</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-slate-500 font-medium">Invoice No:</span>
                  <span className="text-slate-900 font-semibold">{invoice.invoiceNumber}</span>
                  <span className="text-slate-500 font-medium">Date:</span>
                  <span className="text-slate-900">{formatDate(invoice.date)}</span>
                  <span className="text-slate-500 font-medium">Due Date:</span>
                  <span className="text-slate-900">{formatDate(invoice.dueDate)}</span>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="mb-10">
              <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-3">Bill To</h3>
              <p className="text-lg font-semibold text-slate-900">{invoice.client.clientName}</p>
              {invoice.client.clientAddress && <p className="text-slate-600 whitespace-pre-wrap">{invoice.client.clientAddress}</p>}
              {invoice.client.clientEmail && <p className="text-slate-600">{invoice.client.clientEmail}</p>}
            </div>

            {/* Items Table */}
            <div className="mb-10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-sm font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-2">Description</th>
                    <th className="py-3 px-2 text-right">Qty</th>
                    <th className="py-3 px-2 text-right">Price</th>
                    <th className="py-3 px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="py-4 px-2">
                        <p className="font-medium text-slate-900">{item.description}</p>
                        {item.details && (
                          <p className="text-sm text-slate-500 mt-1 whitespace-pre-wrap">{item.details}</p>
                        )}
                      </td>
                      <td className="py-4 px-2 text-right align-top">{item.quantity}</td>
                      <td className="py-4 px-2 text-right align-top">{formatCurrency(item.unitPrice, currency)}</td>
                      <td className="py-4 px-2 text-right font-medium text-slate-900 align-top">{formatCurrency(item.quantity * item.unitPrice, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex flex-col sm:flex-row justify-between gap-8 mb-8">
              <div className="flex-1 space-y-6">
                {invoice.client.paymentTerms && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Payment Terms</h4>
                    <p className="text-sm text-slate-600">{invoice.client.paymentTerms}</p>
                  </div>
                )}
              </div>
              <div className="w-full sm:max-w-xs space-y-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal, currency)}</span>
                </div>
                {(invoice.client.discount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(invoice.client.discount || 0, currency)}</span>
                  </div>
                )}
                {invoice.client.taxRate > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>{invoice.profile.taxLabel || 'Tax'} ({invoice.client.taxRate}%)</span>
                    <span>{formatCurrency(tax, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-slate-900 border-t border-slate-200 pt-3">
                  <span>Total</span>
                  <span>{formatCurrency(total, currency)}</span>
                </div>
              </div>
            </div>

            {/* Notes (Moved to bottom) */}
            {invoice.client.notes && (
              <div className="pt-8 border-t border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Notes</h4>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{invoice.client.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrap in ErrorBoundary to prevent fatal crashes if PDF generation or rendering fails
export function ReviewStep(props: Props) {
  return (
    <ErrorBoundary name="ReviewStep">
      <ReviewStepContent {...props} />
    </ErrorBoundary>
  );
}
