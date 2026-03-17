// filepath: src/components/wizard/ReviewStep.tsx
import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Invoice } from '../../schemas/invoice.schema';
import { calculateSubtotal, calculateTax, calculateTotal } from '../../utils/calculations';
import { formatDate } from '../../utils/date';
import { Printer, ArrowLeft, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface Props {
  invoice: Invoice;
  onPrev: () => void;
  onNew: () => void;
}

export function ReviewStep({ invoice, onPrev, onNew }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const subtotal = calculateSubtotal(invoice.items);
  const tax = calculateTax(subtotal, invoice.client.taxRate);
  const total = calculateTotal(subtotal, tax);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.profile.currency || 'USD',
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    
    try {
      setIsGeneratingPDF(true);
      
      // Add a slight delay to ensure fonts/images are loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try printing instead.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Action Bar (Hidden in Print) */}
      <div className="flex flex-wrap gap-3 print:hidden">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Edit
        </Button>
        <Button onClick={handlePrint} variant="outline" className="flex-1 sm:flex-none">
          <Printer className="w-4 h-4 mr-2" /> Print
        </Button>
        <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="flex-1 sm:flex-none">
          {isGeneratingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />} 
          Save PDF
        </Button>
        <Button variant="secondary" onClick={onNew} className="w-full sm:w-auto sm:ml-auto">
          New Invoice
        </Button>
      </div>

      {/* Invoice Document (Printable Area) */}
      <Card className="print:border-0 print:shadow-none print:w-full print:max-w-none overflow-hidden">
        <CardContent className="p-8 sm:p-12 bg-white">
          <div ref={invoiceRef}>
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
              <div className="flex gap-6 items-start">
                {invoice.profile.logo && (
                  <div className="w-24 h-24 flex-shrink-0">
                    <img src={invoice.profile.logo} alt="Company Logo" className="w-full h-full object-contain object-left-top" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{invoice.profile.companyName}</h1>
                  <p className="text-slate-500 whitespace-pre-wrap">{invoice.profile.address}</p>
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
              {invoice.client.clientAddress && <p className="text-slate-600">{invoice.client.clientAddress}</p>}
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
                      <td className="py-4 px-2 text-right align-top">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-4 px-2 text-right font-medium text-slate-900 align-top">{formatCurrency(item.quantity * item.unitPrice)}</td>
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
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {invoice.client.taxRate > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>{invoice.profile.taxLabel || 'Tax'} ({invoice.client.taxRate}%)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-slate-900 border-t border-slate-200 pt-3">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
