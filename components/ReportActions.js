'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Download, LoaderCircle, Printer, Sprout, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportActions({ analysisId, imageUrl, plantName, currentProfileId }) {
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState(plantName || '');

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingProfiles(true); setError('');
    fetch('/api/plants').then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Plant profiles could not be loaded.');
      if (active) setProfiles(body.profiles || []);
    }).catch((cause) => { if (active) setError(cause.message || 'Plant profiles could not be loaded.'); }).finally(() => { if (active) setLoadingProfiles(false); });
    return () => { active = false; };
  }, [open]);

  async function attach(profileId) {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/plants/${profileId}/analyses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ analysisId }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not add this report to the profile.');
      toast.success('Report added to plant profile.'); setOpen(false);
    } catch (cause) { setError(cause.message || 'Could not add this report to the profile.'); }
    finally { setBusy(false); }
  }

  async function createAndAttach(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/plants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not create the profile.');
      await attach(body.profile.id);
    } catch (cause) { setError(cause.message || 'Could not create the profile.'); setBusy(false); }
  }

  return <>
    <div className="report-action-bar"><button className="button button-outline button-pill" type="button" onClick={() => setOpen(true)}><Sprout size={16}/>{currentProfileId ? 'Change plant profile' : 'Add to plant profile'}</button><a className="button button-outline button-pill" href={`${imageUrl}?download=1`}><Download size={16}/> Download photo</a><button className="button button-outline button-pill print-report-button" type="button" onClick={() => window.print()}><Printer size={16}/> Save report as PDF</button><Link className="button button-pill report-analyze-link" href="/analyze">Analyze another</Link></div>
    {open && <div className="confirm-backdrop profile-picker-backdrop" role="presentation" onClick={() => !busy && setOpen(false)}><section className="confirm-dialog profile-picker" role="dialog" aria-modal="true" aria-labelledby="profile-picker-title" onClick={(event) => event.stopPropagation()}><button className="icon-button profile-picker-close" type="button" aria-label="Close" onClick={() => setOpen(false)} disabled={busy}><X size={18}/></button><span className="eyebrow">KEEP OBSERVATIONS TOGETHER</span><h2 id="profile-picker-title" className="serif">Choose a plant profile</h2><p>Choose a profile for this report, or start a new one.</p>{loadingProfiles ? <div className="profile-picker-loading" role="status"><LoaderCircle className="analysis-spinner" size={18}/> Loading profiles…</div> : <>{profiles.length > 0 && <div className="profile-picker-list">{profiles.map((profile) => <button type="button" className="profile-picker-option" key={profile.id} onClick={() => attach(profile.id)} disabled={busy || profile.id === currentProfileId}><span><strong>{profile.name}</strong><small>{profile.species || profile.category || 'Plant profile'}</small></span>{profile.id === currentProfileId ? <span>Current</span> : busy ? <LoaderCircle className="analysis-spinner" size={16}/> : <span aria-hidden="true">Add ↗</span>}</button>)}</div>}<form className="profile-quick-create" onSubmit={createAndAttach}><label className="field">{profiles.length ? 'Or create a new profile' : 'Create your first profile'}<input value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={100} required placeholder="Plant name"/></label><button className="button button-pill" disabled={busy}>{busy ? <><LoaderCircle className="analysis-spinner" size={16}/> Adding…</> : 'Create and add report'}</button></form></>}{error && <p className="profile-action-error" role="alert">{error}</p>}</section></div>}
  </>;
}
