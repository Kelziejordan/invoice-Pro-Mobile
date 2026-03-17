// filepath: src/components/wizard/ItemsStep.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import { InvoiceItem } from '../../schemas/invoice.schema';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface Props {
  items: InvoiceItem[];
  setItems: (items: InvoiceItem[]) => void;
  currency?: string;
  onNext: () => void;
  onPrev: () => void;
}

export function ItemsStep({ items, setItems, currency = 'USD', onNext, onPrev }: Props) {
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');

  const handleAddItem = () => {
    if (!description || !unitPrice) return;
    
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      description,
      details: details.trim() || undefined,
      quantity: parseFloat(quantity) || 1,
      unitPrice: parseFloat(unitPrice) || 0,
    };

    setItems([...items, newItem]);
    setDescription('');
    setDetails('');
    setQuantity('1');
    setUnitPrice('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Line Items</CardTitle>
        <p className="text-slate-500 text-sm">Add the services or products provided.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Add Item Form */}
        <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-100">
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Deep Cleaning Service" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Comments / Scope of Work (Optional)</Label>
            <textarea 
              id="details" 
              value={details} 
              onChange={(e) => setDetails(e.target.value)} 
              placeholder="e.g. Included living room, kitchen, and 2 bathrooms." 
              className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y text-sm transition-colors"
            />
          </div>
          <div className="flex gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="quantity">Qty / Hrs</Label>
              <Input id="quantity" type="number" min="0.1" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="unitPrice">Price *</Label>
              <Input id="unitPrice" type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <Button variant="secondary" className="w-full" onClick={handleAddItem} disabled={!description || !unitPrice}>
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>

        {/* Items List */}
        {items.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-slate-900">Added Items</h4>
            {items.map(item => (
              <div key={item.id} className="flex items-start justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="flex-1 pr-4">
                  <p className="font-medium text-slate-900">{item.description}</p>
                  {item.details && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{item.details}</p>}
                  <p className="text-sm text-slate-500 mt-2">{item.quantity} x {formatCurrency(item.unitPrice, currency)}</p>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="font-semibold">{formatCurrency(item.quantity * item.unitPrice, currency)}</span>
                  <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors" aria-label="Remove item">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </CardContent>
      <CardFooter className="flex gap-3">
        <Button variant="outline" onClick={onPrev} className="flex-1">Back</Button>
        <Button onClick={onNext} disabled={items.length === 0} className="flex-1">Review Invoice</Button>
      </CardFooter>
    </Card>
  );
}
