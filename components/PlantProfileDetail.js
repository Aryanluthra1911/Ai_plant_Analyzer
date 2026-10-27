'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, LoaderCircle, MapPin, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function PlantProfileDetail({ profile, analyses }) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  async function save(event) {
    event.preventDefault(); setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(['name', 'species', 'category', 'location', 'notes'].map((key) => [key, form.get(key)]));
    try {
      const response = await fetch(`/api/plants/${profile.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Profile could not be updated.');
      toast.success('Plant profile updated.'); router.refresh();
    } catch (error) { toast.error(error.message || 'Profile could not be updated.'); }
    finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true);
    try {
      const response = await fetch(`/api/plants/${profile.id}`, { method: 'DELETE' });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Profile could not be deleted.');
      router.push('/plants'); router.refresh();
    } catch (error) { toast.error(error.message || 'Profile could not be deleted.'); }
    finally { setBusy(false); }
  }

  return <div className="profile-detail-page">
    <Link className="report-back-link" href="/plants"><ArrowLeft size={16}/> All plant profiles</Link>
    <div className="profile-detail-heading"><div><span className="eyebrow">PLANT PROFILE</span><h1 className="page-title serif">{profile.name}</h1><p className="subtle">{profile.species || profile.category || 'Your saved observations for this plant'}{profile.location ? <> · <MapPin size={14} className="inline-icon"/> {profile.location}</> : null}</p></div><span className="pill">{analyses.length} {analyses.length === 1 ? 'photo' : 'photos'}</span></div>
    <div className="profile-detail-grid"><form className="card profile-edit-form" onSubmit={save} aria-busy={busy}><span className="eyebrow">PROFILE DETAILS</span><h2 className="serif">About this plant</h2><label className="field">Plant name<input name="name" maxLength={100} defaultValue={profile.name} required/></label><label className="field">Species<input name="species" maxLength={120} defaultValue={profile.species || ''} placeholder="e.g. Monstera deliciosa"/></label><label className="field">Plant type<input name="category" maxLength={60} defaultValue={profile.category || ''} placeholder="Houseplant, herb, tree…"/></label><label className="field">Location<input name="location" maxLength={120} defaultValue={profile.location || ''} placeholder="Living room, balcony…"/></label><label className="field">Notes<textarea name="notes" maxLength={2000} defaultValue={profile.notes || ''} placeholder="Care notes and details to remember"/></label><div className="profile-form-actions"><button className="button button-pill" disabled={busy}>{busy ? <><LoaderCircle className="analysis-spinner" size={16}/> Saving…</> : <><Save size={15}/> Save changes</>}</button><button className="button button-outline button-pill profile-delete-button" type="button" onClick={() => setConfirmDelete(true)} disabled={busy}><Trash2 size={15}/> Delete profile</button></div></form>
      <section className="profile-timeline"><div className="section-heading"><div><span className="eyebrow">PHOTO JOURNAL</span><h2 className="serif">Saved analyses</h2></div><Link href="/analyze" className="link-arrow">Add a photo ↗</Link></div>{analyses.length ? <div className="profile-analysis-list">{analyses.map((analysis) => <Link className="card profile-analysis-card" href={`/results/${analysis.id}`} key={analysis.id}><img src={`/api/analyses/${encodeURIComponent(analysis.id)}/image`} alt=""/><span><strong>{analysis.plantName || profile.name}</strong><small>{new Date(analysis.createdAt).toLocaleDateString()} · {analysis.status.replaceAll('_', ' ')}</small><small>{analysis.result?.summary || 'Open this saved analysis'}</small></span><span aria-hidden="true">↗</span></Link>)}</div> : <div className="empty-state"><p>No analyses added to this profile yet. Open a report and choose “Add to plant profile” to link it here.</p><Link className="link-arrow" href="/history">Browse analysis history</Link></div>}</section></div>
    {confirmDelete && <div className="confirm-backdrop" role="presentation" onClick={() => !busy && setConfirmDelete(false)}><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-profile-title" onClick={(event) => event.stopPropagation()}><button className="icon-button profile-picker-close" type="button" aria-label="Close" onClick={() => setConfirmDelete(false)} disabled={busy}><X size={18}/></button><span className="eyebrow">PLANT PROFILES</span><h2 id="delete-profile-title" className="serif">Delete this profile?</h2><p>The {profile.name} profile will be removed. Its saved analyses will stay in your history.</p><div className="confirm-dialog-actions"><button className="button button-outline button-pill" type="button" onClick={() => setConfirmDelete(false)} disabled={busy}>Keep profile</button><button className="button button-danger button-pill" type="button" onClick={remove} disabled={busy}>{busy ? <><LoaderCircle className="analysis-spinner" size={16}/> Deleting…</> : 'Delete profile'}</button></div></section></div>}
  </div>;
}
