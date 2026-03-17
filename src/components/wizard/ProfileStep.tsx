// filepath: src/components/wizard/ProfileStep.tsx
import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import { Profile } from '../../schemas/invoice.schema';
import { Upload, X } from 'lucide-react';

interface Props {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  onNext: () => void;
}

export function ProfileStep({ profile, setProfile, onNext }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setProfile({ ...profile, logo: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isValid = profile.companyName.trim() !== '' && profile.address.trim() !== '';

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Your Company Profile</CardTitle>
        <p className="text-slate-500 text-sm">This information is saved securely on your device for future invoices.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Company Logo</Label>
          <div className="flex items-center gap-4">
            {profile.logo ? (
              <div className="relative w-24 h-24 border rounded-md overflow-hidden bg-slate-50">
                <img src={profile.logo} alt="Company Logo" className="w-full h-full object-contain" />
                <button 
                  onClick={removeLogo}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm hover:bg-slate-100 text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition-colors"
              >
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-xs">Upload</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleLogoUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <div className="text-sm text-slate-500 flex-1">
              Upload a logo to make your invoices look more professional.
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input id="companyName" name="companyName" value={profile.companyName} onChange={handleChange} placeholder="e.g. Sparkle Cleaners" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Input id="address" name="address" value={profile.address} onChange={handleChange} placeholder="123 Main St, City, State" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={profile.email} onChange={handleChange} placeholder="hello@sparkle.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" value={profile.phone} onChange={handleChange} placeholder="(555) 123-4567" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gstNumber">GST / Tax Number</Label>
          <Input id="gstNumber" name="gstNumber" value={profile.gstNumber} onChange={handleChange} placeholder="Optional" />
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <select 
              id="currency" 
              name="currency" 
              value={profile.currency || 'USD'} 
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
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
            <Input id="taxLabel" name="taxLabel" value={profile.taxLabel || 'Tax'} onChange={handleChange} placeholder="e.g. VAT, GST" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onNext} disabled={!isValid}>
          Continue to Client Details
        </Button>
      </CardFooter>
    </Card>
  );
}
