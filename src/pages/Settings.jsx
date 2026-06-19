import { useEffect, useState } from 'react';
import { getProfile, saveProfile } from '../db/db.js';
import { exportBackup, importBackup, backupFilename } from '../lib/backup.js';
import { shareFile, openBlob } from '../lib/share.js';
import { computeTotals } from '../lib/format.js';
import { sampleBillData } from '../lib/sampleBill.js';
import { useToast } from '../components/Toast.jsx';

const EMPTY = { businessName: '', ownerName: '', phone: '', email: '', address: '', ccFeeRate: '3' };

export default function Settings() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [logoBlob, setLogoBlob] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    getProfile().then((p) => {
      if (p) {
        setForm({
          businessName: p.businessName || '',
          ownerName: p.ownerName || '',
          phone: p.phone || '',
          email: p.email || '',
          address: p.address || '',
          ccFeeRate: p.ccFeeRate != null ? String(p.ccFeeRate) : '3',
        });
        if (p.logoBlob) {
          setLogoBlob(p.logoBlob);
          setLogoUrl(URL.createObjectURL(p.logoBlob));
        }
      }
    });
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function onLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogoBlob(file);
    setLogoUrl(URL.createObjectURL(file));
  }

  async function saveProfileForm() {
    await saveProfile({ ...form, ccFeeRate: Number(form.ccFeeRate) || 0, logoBlob });
    toast('Profile saved');
  }

  async function previewSample() {
    // Load the PDF library on demand so it stays out of the main bundle.
    const { generateBillPdf } = await import('../lib/pdf.js');
    const { account, contact, workOrder, lineItems, taxRate } = sampleBillData();
    const ccRate = Number(form.ccFeeRate) || 0;
    const { subtotal, taxAmount, ccFeeAmount, total } = computeTotals(lineItems, taxRate, ccRate, true);
    const bill = {
      lineItems,
      taxRate,
      subtotal,
      taxAmount,
      ccFeeApplied: true,
      ccFeeRate: ccRate,
      ccFeeAmount,
      total,
      signatureBlob: null,
      pdfGeneratedAt: Date.now(),
    };
    const blob = await generateBillPdf({
      profile: { ...form, logoBlob },
      account,
      contact,
      workOrder,
      bill,
      photoBlobs: [],
    });
    openBlob(blob, 'sample-bill-of-sale.pdf');
    toast('Opening sample PDF…');
  }

  async function backup() {
    const blob = await exportBackup();
    const result = await shareFile(blob, backupFilename(), {
      title: 'Field Service backup',
      text: 'Field Service data backup',
    });
    toast(result === 'downloaded' ? 'Backup downloaded' : 'Backup ready — save it to the cloud');
  }

  async function restore(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!confirm('Restoring will REPLACE all current data with the backup. Continue?')) return;
    try {
      const counts = await importBackup(file);
      toast(`Restored ${counts.accounts} accounts, ${counts.workOrders} work orders`);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      toast(err.message || 'Restore failed');
    }
  }

  return (
    <>
      <h1 style={{ marginTop: 4 }}>Settings</h1>

      <div className="section-title">Business profile (appears on every Bill of Sale)</div>

      <label>Business name</label>
      <input value={form.businessName} onChange={set('businessName')} />

      <label>Your name</label>
      <input value={form.ownerName} onChange={set('ownerName')} />

      <label>Phone</label>
      <input type="tel" value={form.phone} onChange={set('phone')} />

      <label>Email (used as your BCC on bills)</label>
      <input type="email" value={form.email} onChange={set('email')} />

      <label>Address</label>
      <textarea value={form.address} onChange={set('address')} />

      <label>Default credit card fee % (used on new bills; editable per bill)</label>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={form.ccFeeRate}
        onChange={set('ccFeeRate')}
        style={{ width: 140 }}
      />

      <label>Logo (optional)</label>
      <div className="row" style={{ gap: 12 }}>
        {logoUrl && (
          <img src={logoUrl} alt="logo" style={{ width: 64, height: 64, objectFit: 'contain', background: '#fff', borderRadius: 10 }} />
        )}
        <label className="btn btn--ghost btn--sm" style={{ margin: 0 }}>
          Choose logo
          <input type="file" accept="image/*" onChange={onLogo} hidden />
        </label>
      </div>

      <div className="btn-row">
        <button className="btn btn--ghost" onClick={previewSample}>
          👁 Preview sample
        </button>
        <button className="btn" onClick={saveProfileForm}>
          Save profile
        </button>
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
        “Preview sample” opens an example Bill of Sale PDF using your current profile above,
        so you can check how it looks (including the credit card fee).
      </p>

      <div className="section-title">Backup &amp; restore</div>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          Backup exports <strong>everything</strong> (accounts, contacts, work orders, photos, signatures)
          to one file. Use your share sheet to save it to Google Drive or iCloud / Files.
        </p>
        <button className="btn" onClick={backup}>
          ⬆️ Backup now
        </button>
        <label className="btn btn--ghost" style={{ marginTop: 10 }}>
          ⬇️ Restore from file
          <input type="file" accept="application/json,.json" onChange={restore} hidden />
        </label>
      </div>
    </>
  );
}
