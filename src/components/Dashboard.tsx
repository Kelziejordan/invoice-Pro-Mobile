import React from 'react';
import { Invoice } from '../schemas/invoice.schema';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import { calculateSubtotal, calculateTax, calculateTotal } from '../utils/calculations';
import { FileText, Plus, Trash2, Edit } from 'lucide-react';

interface Props {
  invoices: Invoice[];
  onNewInvoice: () => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
}

export function Dashboard({ invoices, onNewInvoice, onEditInvoice, onDeleteInvoice }: Props) {
  if (invoices.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6" aria-hidden="true">
          <FileText className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No invoices yet</h2>
        <p className="text-slate-500 max-w-md mb-8">
          Create your first professional invoice in seconds using our AI-powered wizard.
        </p>
        <Button onClick={onNewInvoice} size="lg">
          <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
          Create First Invoice
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Invoice History</h2>
          <p className="text-slate-500">Manage and track your past invoices.</p>
        </div>
        <Button onClick={onNewInvoice}>
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          New Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {invoices.map((invoice) => {
          const subtotal = calculateSubtotal(invoice.items);
          const tax = calculateTax(subtotal, invoice.client.taxRate);
          const total = calculateTotal(subtotal, tax);
          const currency = invoice.profile.currency || 'USD';

          return (
            <Card key={invoice.id || invoice.invoiceNumber} className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{invoice.client.clientName}</CardTitle>
                    <p className="text-sm text-slate-500">{invoice.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatCurrency(total, currency)}</p>
                    <p className="text-xs text-slate-500">{formatDate(invoice.date)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-sm text-slate-600 space-y-1">
                  <p className="flex justify-between">
                    <span>Items:</span>
                    <span className="font-medium">{invoice.items.length}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Due:</span>
                    <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                  </p>
                </div>
              </CardContent>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 rounded-b-xl">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 bg-white"
                  onClick={() => onEditInvoice(invoice)}
                  aria-label={`Edit invoice ${invoice.invoiceNumber}`}
                >
                  <Edit className="w-4 h-4 mr-2" aria-hidden="true" /> View / Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white text-red-600 hover:bg-red-50 hover:text-red-700 border-slate-200"
                  onClick={() => {
                    if (invoice.id) onDeleteInvoice(invoice.id);
                  }}
                  aria-label={`Delete invoice ${invoice.invoiceNumber}`}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
