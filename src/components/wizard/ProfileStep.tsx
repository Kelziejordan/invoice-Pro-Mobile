import React, { useState } from 'react';
import { Profile } from '../../schemas/invoice.schema';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Card, CardContent } from '../ui/Card';
import { Upload, Building2, Settings2, Trash2 } from 'lucide-react';

interface Props {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  onNext: () => void;
}

export function ProfileStep({ profile, setProfile, onNext }: Props) {
  const [error, setError] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Logo image must be less than 2MB to ensure it saves correctly.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile({ ...profile, logo: reader.result as string });
      setError(null);
    };
    reader.onerror = () => {
      setError("Failed to read the image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setProfile({ ...profile, logo: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.companyName.trim()) {
      setError("Company Name is required.");
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Your Business Profile</h2>
        <p className="text-slate-500">Set up your company details. This information will be saved for future invoices.</p>
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
                <Building2 className="w-5 h-5" aria-hidden="true" />
                <h3 className="font-semibold text-slate-900">Company Details</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={profile.companyName}
                  onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                  placeholder="Acme Corp"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="billing@acmecorp.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <textarea
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="123 Business Rd&#10;Suite 100&#10;City, State 12345"
                  className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-base placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[100px] resize-y"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstNumber">Tax ID / GST Number</Label>
                <Input
                  id="gstNumber"
                  value={profile.gstNumber}
                  onChange={(e) => setProfile({ ...profile, gstNumber: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <Settings2 className="w-5 h-5" aria-hidden="true" />
                <h3 className="font-semibold text-slate-900">Invoice Settings</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Company Logo</Label>
                <div className="flex items-center gap-4">
                  {profile.logo && (
                    <div className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex-shrink-0 group">
                      <img src={profile.logo} alt="Company Logo" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove logo"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    <p className="text-xs text-slate-500 mt-1">Recommended: PNG or JPG, max 2MB.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={profile.currency}
                    onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AUD">AUD ($)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxLabel">Tax Label</Label>
                  <Input
                    id="taxLabel"
                    value={profile.taxLabel}
                    onChange={(e) => setProfile({ ...profile, taxLabel: e.target.value })}
                    placeholder="e.g. Tax, VAT, GST"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                  <Input
                    id="invoicePrefix"
                    value={profile.invoiceConfig.prefix}
                    onChange={(e) => setProfile({ 
                      ...profile, 
                      invoiceConfig: { ...profile.invoiceConfig, prefix: e.target.value } 
                    })}
                    placeholder="INV-"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextNumber">Next Number</Label>
                  <Input
                    id="nextNumber"
                    type="number"
                    min="1"
                    value={profile.invoiceConfig.nextNumber}
                    onChange={(e) => setProfile({ 
                      ...profile, 
                      invoiceConfig: { ...profile.invoiceConfig, nextNumber: parseInt(e.target.value) || 1 } 
                    })}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Next invoice will be: <strong className="text-slate-700">{profile.invoiceConfig.prefix}{profile.invoiceConfig.nextNumber}</strong>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-slate-200">
        <Button type="submit" size="lg">
          Continue to Client Details
        </Button>
      </div>
    </form>
  );
}
