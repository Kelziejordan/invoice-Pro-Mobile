// filepath: src/components/wizard/ClientStep.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import { Client } from '../../schemas/invoice.schema';

interface Props {
  client: Client;
  setClient: (client: Client) => void;
  date: string;
  setDate: (date: string) => void;
  dueDate: string;
  setDueDate: (dueDate: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function ClientStep({ client, setClient, date, setDate, dueDate, setDueDate, onNext, onPrev }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'taxRate') {
      const numValue = parseFloat(value);
      setClient({ ...client, [name]: isNaN(numValue) ? 0 : numValue });
    } else {
      setClient({ ...client, [name]: value });
    }
  };

  const isValid = client.clientName.trim() !== '' && new Date(dueDate) >= new Date(date);

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Client & Invoice Details</CardTitle>
        <p className="text-slate-500 text-sm">Who is this invoice for and what are the terms?</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-2">
            <Label htmlFor="date">Invoice Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input 
              id="dueDate" 
              type="date" 
              value={dueDate} 
              onChange={(e) => setDueDate(e.target.value)} 
              className={new Date(dueDate) < new Date(date) ? 'border-red-500 focus:ring-red-500' : ''}
            />
            {new Date(dueDate) < new Date(date) && (
              <p className="text-xs text-red-500">Due date cannot be before invoice date</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientName">Client Name *</Label>
          <Input id="clientName" name="clientName" value={client.clientName} onChange={handleChange} placeholder="Sarah Johnson" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientAddress">Client Address</Label>
          <Input id="clientAddress" name="clientAddress" value={client.clientAddress} onChange={handleChange} placeholder="456 Elm St, City, State" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Client Email</Label>
            <Input id="clientEmail" name="clientEmail" type="email" value={client.clientEmail} onChange={handleChange} placeholder="sarah@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input id="taxRate" name="taxRate" type="number" min="0" max="100" step="0.01" value={client.taxRate === 0 ? '' : client.taxRate} onChange={handleChange} placeholder="e.g. 10" />
          </div>
        </div>
        
        <div className="border-t border-slate-100 pt-4 mt-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Input id="paymentTerms" name="paymentTerms" value={client.paymentTerms || ''} onChange={handleChange} placeholder="e.g. Net 30, Due on receipt" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea 
              id="notes" 
              name="notes" 
              value={client.notes || ''} 
              onChange={handleChange} 
              placeholder="Thank you for your business! Bank details: ..."
              className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-3">
        <Button variant="outline" onClick={onPrev} className="flex-1">Back</Button>
        <Button onClick={onNext} disabled={!isValid} className="flex-1">Continue to Items</Button>
      </CardFooter>
    </Card>
  );
}
