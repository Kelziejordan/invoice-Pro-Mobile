import React, { useState } from 'react';
import { Client } from '../../schemas/invoice.schema';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Card, CardContent } from '../ui/Card';
import { User, Calendar, FileText } from 'lucide-react';

interface Props {
  client: Client;
  setClient: (client: Client) => void;
  date: string;
  setDate: (date: string) => void;
  dueDate: string;
  setDueDate: (date: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function ClientStep({ client, setClient, date, setDate, dueDate, setDueDate, onNext, onPrev }: Props) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.clientName.trim()) {
      setError("Client Name is required.");
      return;
    }
    if (new Date(dueDate) < new Date(date)) {
      setError("Due date cannot be before the invoice date.");
      return;
    }
    if (client.paymentTerms?.toLowerCase().includes('receipt') && dueDate !== date) {
      setError("Payment terms indicate 'receipt' but the Due Date doesn't match the Invoice Date.");
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Client & Details</h2>
        <p className="text-slate-500">Who is this invoice for? Set the dates and payment terms.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200" role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <User className="w-5 h-5" aria-hidden="true" />
                <h3 className="font-semibold text-slate-900">Billed To</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientName">Client / Company Name *</Label>
                <Input
                  id="clientName"
                  value={client.clientName}
                  onChange={(e) => setClient({ ...client, clientName: e.target.value })}
                  placeholder="Client Name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={client.clientEmail}
                  onChange={(e) => setClient({ ...client, clientEmail: e.target.value })}
                  placeholder="client@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientAddress">Client Address</Label>
                <textarea
                  id="clientAddress"
                  value={client.clientAddress}
                  onChange={(e) => setClient({ ...client, clientAddress: e.target.value })}
                  placeholder="Client Address"
                  className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-base placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[100px] resize-y"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobNumber">Job Number (Optional)</Label>
                <Input
                  id="jobNumber"
                  value={client.jobNumber || ''}
                  onChange={(e) => setClient({ ...client, jobNumber: e.target.value })}
                  placeholder="e.g. JOB-2024-001"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <Calendar className="w-5 h-5" aria-hidden="true" />
                <h3 className="font-semibold text-slate-900">Dates & Terms</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceDate">Invoice Date</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      if (client.paymentTerms?.toLowerCase().includes('receipt') && e.target.value !== date) {
                        setClient({ ...client, paymentTerms: '' });
                      }
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  id="paymentTerms"
                  list="payment-terms-options"
                  value={client.paymentTerms || ''}
                  onChange={(e) => {
                    const terms = e.target.value;
                    setClient({ ...client, paymentTerms: terms });
                    
                    if (!date) return;
                    const dateObj = new Date(date);
                    const termsLower = terms.toLowerCase();
                    
                    if (termsLower === 'due on receipt' || termsLower === 'payable upon receipt') {
                      setDueDate(date);
                    } else if (termsLower === 'net 15') {
                      dateObj.setDate(dateObj.getDate() + 15);
                      setDueDate(dateObj.toISOString().split('T')[0]);
                    } else if (termsLower === 'net 30') {
                      dateObj.setDate(dateObj.getDate() + 30);
                      setDueDate(dateObj.toISOString().split('T')[0]);
                    }
                  }}
                  placeholder="e.g. Net 30, Due on receipt"
                />
                <datalist id="payment-terms-options">
                  <option value="Due on receipt" />
                  <option value="Payable upon receipt" />
                  <option value="Net 15" />
                  <option value="Net 30" />
                </datalist>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2 text-indigo-600">
                  <FileText className="w-5 h-5" aria-hidden="true" />
                  <h3 className="font-semibold text-slate-900">Additional Info</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={client.taxRate}
                      onChange={(e) => setClient({ ...client, taxRate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount (Flat Amount)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={client.discount || 0}
                      onChange={(e) => setClient({ ...client, discount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Footer</Label>
                <textarea
                  id="notes"
                  value={client.notes}
                  onChange={(e) => setClient({ ...client, notes: e.target.value })}
                  placeholder="Thank you for your business!"
                  className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-base placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[80px] resize-y"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onPrev} size="lg">
          Back
        </Button>
        <Button type="submit" size="lg">
          Continue to Line Items
        </Button>
      </div>
    </form>
  );
}
