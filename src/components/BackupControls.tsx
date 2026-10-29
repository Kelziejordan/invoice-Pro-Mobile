import React, { useRef, useState } from 'react';
import { Download, Upload, ShieldCheck } from 'lucide-react';
import { Profile, Invoice } from '../schemas/invoice.schema';
import { createBackup, parseBackup, restoreBackup } from '../utils/backup';
import { Button } from './ui/Button';

interface Props {
  profile: Profile;
  invoices: Invoice[];
}

export function BackupControls({ profile, invoices }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const exportBackup = () => {
    try {
      const backup = createBackup(profile, invoices);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `invoice-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setIsError(false);
      setMessage('Backup exported. Keep the JSON file somewhere separate from this device.');
    } catch {
      setIsError(true);
      setMessage('Backup could not be created. Check the saved invoice data and try again.');
    }
  };

  const importBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setIsError(true);
      setMessage('Backup file exceeds the 10 MB safety limit.');
      return;
    }

    try {
      const backup = parseBackup(await file.text());
      const accepted = window.confirm(
        `Restore ${backup.invoices.length} invoice(s) and the business profile from this backup? This replaces the current saved invoices and profile. Export a backup of the current data first if you may need it.`
      );
      if (!accepted) return;
      restoreBackup(backup, window.localStorage);
      setIsError(false);
      setMessage('Restore completed. Reloading the app to load the restored data.');
      window.location.reload();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Restore failed. Existing data was not intentionally changed.');
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="backup-heading">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-indigo-50 p-2 text-indigo-700" aria-hidden="true"><ShieldCheck className="h-5 w-5" /></div>
        <div>
          <h3 id="backup-heading" className="font-semibold text-slate-900">Your data stays on this device</h3>
          <p className="text-sm text-slate-600">Export a backup before changing devices or clearing browser data. Restore replaces saved invoices and your business profile.</p>
          {message && <p className={`mt-2 text-sm ${isError ? 'text-red-700' : 'text-emerald-700'}`} role={isError ? 'alert' : 'status'}>{message}</p>}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <input ref={inputRef} className="sr-only" type="file" accept="application/json,.json" aria-label="Choose Invoice Pro backup file" onChange={importBackup} />
        <Button variant="outline" onClick={() => inputRef.current?.click()}><Upload className="mr-2 h-4 w-4" aria-hidden="true" />Restore</Button>
        <Button onClick={exportBackup}><Download className="mr-2 h-4 w-4" aria-hidden="true" />Backup</Button>
      </div>
    </section>
  );
}
