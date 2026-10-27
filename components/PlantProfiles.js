'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoaderCircle, MapPin, Plus, Sprout } from 'lucide-react';
import { toast } from 'sonner';

export default function PlantProfiles({ profiles }) {
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function createProfile(event) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(['name', 'species', 'category', 'location', 'notes'].map((key) => [key, form.get(key)]));
    try {
      const response = await fetch('/api/plants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'The plant profile could not be created.');
      toast.success('Plant profile created.');
      setCreating(false);
      router.push(`/plants/${body.profile.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error.message || 'The plant profile could not be created.');
    } finally { setBusy(false); }
  }

  return <>
    <div className="section-heading profile-page-heading"><div><span className="eyebrow">YOUR GARDEN</span><h1 className="page-title serif">Plant profiles</h1><p className="subtle" style={{ margin: 0 }}>Keep photos and observations together for each plant.</p></div><button className="button button-pill" type="button" onClick={() => setCreating((value) => !value)}><Plus size={16}/>{creating ? 'Close form' : 'Add a plant'}</button></div>
    {creating && <form className="card profile-create-form" onSubmit={createProfile} aria-busy={busy}>
      <h2 className="serif">Start a plant profile</h2>
      <div className="profile-form-grid"><label className="field">Plant name<input name="name" maxLength={100} placeholder="e.g. Kitchen monstera" required/></label><label className="field">Species (optional)<input name="species" maxLength={120} placeholder="e.g. Monstera deliciosa"/></label><label className="field">Plant type<input name="category" maxLength={60} placeholder="Houseplant, herb, tree…"/></label><label className="field">Location<input name="location" maxLength={120} placeholder="Living room, balcony…"/></label><label className="field profile-notes-field">Notes<textarea name="notes" maxLength={2000} placeholder="Anything you want to remember about this plant"/></label></div>
      <button className="button button-pill" disabled={busy}>{busy ? <><LoaderCircle className="analysis-spinner" size={16}/> Saving…</> : 'Create profile'}</button>
    </form>}
    {profiles.length ? <div className="profile-grid">{profiles.map((profile) => <Link className="card profile-card" href={`/plants/${profile.id}`} key={profile.id}><span className="profile-card-icon"><Sprout size={20}/></span><span className="eyebrow">{profile.category || 'PLANT PROFILE'}</span><h2 className="serif">{profile.name}</h2>{profile.species && <p className="profile-species">{profile.species}</p>}<div className="profile-card-meta">{profile.location && <span><MapPin size={14}/>{profile.location}</span>}<span>{profile._count.analyses} {profile._count.analyses === 1 ? 'photo' : 'photos'}</span></div></Link>)}</div> : !creating && <div className="empty-state profile-empty"><Sprout size={28}/><p>No plant profiles yet. Create one to keep a plant’s photos and notes together.</p><button className="link-arrow" type="button" onClick={() => setCreating(true)}>Create your first profile <Plus size={15}/></button></div>}
  </>;
}
