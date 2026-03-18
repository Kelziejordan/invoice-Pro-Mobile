import React, { useState } from 'react';
import { InvoiceItem } from '../../schemas/invoice.schema';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Card, CardContent } from '../ui/Card';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface Props {
  items: InvoiceItem[];
  setItems: (items: InvoiceItem[]) => void;
  currency: string;
  onNext: () => void;
  onPrev: () => void;
}

export function ItemsStep({ items, setItems, currency, onNext, onPrev }: Props) {
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        description: '',
        details: '',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const moveItemUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setItems(newItems);
  };

  const moveItemDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("Please add at least one line item.");
      return;
    }
    
    // Validate items
    const hasEmptyDescription = items.some(item => !item.description.trim());
    if (hasEmptyDescription) {
      setError("All items must have a description.");
      return;
    }

    setError(null);
    onNext();
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Line Items</h2>
        <p className="text-slate-500">Add the products or services you are billing for.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200" role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 mb-4">No items added yet.</p>
            <Button type="button" onClick={handleAddItem} variant="outline">
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" /> Add First Item
            </Button>
          </div>
        ) : (
          items.map((item, index) => (
            <Card key={item.id} className="overflow-visible">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="hidden sm:flex flex-col items-center justify-center mt-8 gap-1 text-slate-400">
                    <button 
                      type="button" 
                      onClick={() => moveItemUp(index)}
                      disabled={index === 0}
                      className="p-1 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                      aria-label="Move item up"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => moveItemDown(index)}
                      disabled={index === items.length - 1}
                      className="p-1 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                      aria-label="Move item down"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-4 w-full">
                    <div className="sm:col-span-6 space-y-2">
                      <Label htmlFor={`desc-${item.id}`}>Description</Label>
                      <Input
                        id={`desc-${item.id}`}
                        value={item.description}
                        onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                        placeholder="Service or product name"
                        required
                      />
                      <Input
                        value={item.details || ''}
                        onChange={(e) => handleUpdateItem(item.id, 'details', e.target.value)}
                        placeholder="Additional details (optional)"
                        className="text-sm h-10 text-slate-600 bg-slate-50"
                        aria-label="Additional details"
                      />
                    </div>
                    
                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor={`qty-${item.id}`}>Qty</Label>
                      <Input
                        id={`qty-${item.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    
                    <div className="sm:col-span-3 space-y-2">
                      <Label htmlFor={`price-${item.id}`}>Price</Label>
                      <Input
                        id={`price-${item.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>

                    <div className="sm:col-span-1 flex items-end justify-end pb-1 sm:pb-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        aria-label={`Remove item ${index + 1}`}
                      >
                        <Trash2 className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <Button type="button" onClick={handleAddItem} variant="outline" className="w-full sm:w-auto bg-white">
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" /> Add Another Item
          </Button>
          <div className="text-right w-full sm:w-auto">
            <p className="text-sm text-slate-500 font-medium mb-1">Subtotal</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(subtotal, currency)}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-6 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onPrev} size="lg">
          Back
        </Button>
        <Button type="submit" size="lg">
          Review Invoice
        </Button>
      </div>
    </form>
  );
}
