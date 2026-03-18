import React, { useRef, useState } from 'react';
import { Invoice } from '../../schemas/invoice.schema';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { calculateSubtotal, calculateTax, calculateTotal } from '../../utils/calculations';
import { Download, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ErrorBoundary } from '../ErrorBoundary';

interface Props {
  invoice: Invoice;
  onPrev: () => void;
  onNew: () => void;
}

function ReviewStepContent({ invoice, onPrev, onNew }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        scale: 2, // Higher resolution
        useCORS: true, // Allow loading external images (like logos)
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
      <Card className="print:border-0 print:shadow-none print:w-full print:max-w-none overflow-hidden">
        <CardContent className="p-8 sm:p-12 bg-white">
          <div ref={invoiceRef} className="bg-white text-slate-900">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
              <div className="flex gap-6 items-start">
                {invoice.profile.logo && (
                  <div className="w-24 h-24 flex-shrink-0">
                    <img src={invoice.profile.logo} alt="Company Logo" className="w-full h-full object-contain object-left-top" crossOrigin="anonymous" />
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

            {/* Totals & Notes */}
            <div className="flex flex-col sm:flex-row justify-between gap-8">
              <div className="flex-1 space-y-6">
                {invoice.client.paymentTerms && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Payment Terms</h4>
                    <p className="text-sm text-slate-600">{invoice.client.paymentTerms}</p>
                  </div>
                )}
                {invoice.client.notes && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Notes</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{invoice.client.notes}</p>
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
