'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CloudUpload, Leaf, LoaderCircle, Sparkles, X } from 'lucide-react';

function explainAnalysisError(error) {
  if (error?.code === 'GEMINI_UPSTREAM_ERROR') {
    return { title: 'Gemini returned a server error', message: `The request reached Gemini, but its server could not complete it${error.upstreamStatus ? ` (HTTP ${error.upstreamStatus})` : ''}. This is usually temporary and does not mean the photo is bad. Retry shortly.` };
  }
  if (error?.code === 'GEMINI_NETWORK_ERROR') {
    return { title: 'Could not reach Gemini', message: `The app server did not receive a response from Google${error.networkCode ? ` (${error.networkCode})` : ''}. Check the server’s internet or firewall access to generativelanguage.googleapis.com, then retry.` };
  }
  if (error?.code === 'GEMINI_TIMEOUT') {
    return { title: 'Gemini did not respond in time', message: 'The server waited 50 seconds and then stopped the request. No analysis report was saved; your selected photo is still here. This can be a slow or stalled Gemini connection, not a photo-quality problem. If it keeps happening, check server access to generativelanguage.googleapis.com and use the diagnostic ID below.' };
  }
  if (error?.code === 'GEMINI_RATE_LIMITED') {
    return { title: 'Gemini request limit reached', message: `Google limited this request${error.upstreamStatus ? ` (HTTP ${error.upstreamStatus})` : ''}. This can happen when the API quota or request rate is exhausted. Wait, then check the Gemini API project’s quota if it continues.` };
  }
  if (error?.code === 'GEMINI_CONFIGURATION_ERROR' || error?.code === 'GEMINI_NOT_CONFIGURED') {
    return { title: 'Gemini setup needs attention', message: `Google rejected the key or model${error.upstreamStatus ? ` (HTTP ${error.upstreamStatus})` : ''}. Check GEMINI_API_KEY, GEMINI_MODEL, and API access in the server environment.` };
  }
  return { title: 'Your photo could not be analyzed', message: error?.message || 'Please try again. Your selected photo is still here.' };
}

export default function Analyzer() {
  const router = useRouter();
  const ref = useRef(null);
  const loadingRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [failure, setFailure] = useState(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    if (busy) loadingRef.current?.focus();
  }, [busy]);

  function pick(nextFile) {
    if (!nextFile) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(nextFile.type)) {
      toast.error('Choose a JPG, PNG, or WEBP image.');
      return;
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      toast.error('Choose an image smaller than 10 MB.');
      return;
    }
    setFailure(null);
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
  }

  async function submit(event) {
    event.preventDefault();
    if (!file) {
      toast.error('Add a plant photo first.');
      return;
    }

    const form = event.currentTarget;
    const data = new FormData();
    data.set('image', file);
    data.set('plantName', form.elements.plantName.value);
    data.set('plantCategory', form.elements.plantCategory.value);
    data.set('symptomDescription', form.elements.symptomDescription.value);
    setFailure(null);
    setBusy(true);

    try {
      const response = await fetch('/api/analyses', { method: 'POST', body: data });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(result.error || 'The photo could not be analyzed.');
        error.code = result.code;
        error.status = response.status;
        error.requestId = result.requestId;
        error.upstreamStatus = result.upstreamStatus;
        error.networkCode = result.networkCode;
        throw error;
      }
      router.push(`/results/${result.analysis.id}`);
      router.refresh();
    } catch (error) {
      setFailure({ ...explainAnalysisError(error), code: error?.code, requestId: error?.requestId });
    } finally {
      setBusy(false);
    }
  }

  return <>
    <form onSubmit={submit} className="two-col" aria-busy={busy} inert={busy}>
      <div>
        <div className="card" style={{ padding: 22 }}>
          <div className="section-heading" style={{ marginBottom: 14 }}>
            <div><span className="eyebrow">01 — Your photo</span><h2 className="serif" style={{ fontSize: 23, marginTop: 7 }}>Show us what you see</h2></div>
            <span className="field-hint">JPG, PNG or WEBP · Up to 10 MB</span>
          </div>
          <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => pick(event.target.files?.[0])} />
          <div className={`upload-zone ${preview ? 'has-image' : ''}`} onClick={() => !preview && ref.current?.click()} onDragOver={(event) => { event.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(event) => { event.preventDefault(); setDrag(false); pick(event.dataTransfer.files?.[0]); }} style={drag ? { borderColor: 'var(--olive)', background: 'var(--sage)' } : {}}>
            {preview ? <div className="upload-preview"><img src={preview} alt="Selected plant preview"/><div className="preview-controls"><button type="button" className="text-button" onClick={() => ref.current?.click()}>Replace photo</button><button type="button" className="text-button" onClick={() => { setFile(null); setPreview(''); setFailure(null); if (ref.current) ref.current.value = ''; }}>Remove <X size={13}/></button></div></div> : <><span className="upload-icon"><CloudUpload size={22}/></span><strong style={{ color: 'var(--ink)', fontSize: 14 }}>Drop a photo here</strong><span style={{ fontSize: 12, margin: '7px 0 15px' }}>or choose a file from your device</span><button type="button" className="button button-outline button-small" onClick={(event) => { event.stopPropagation(); ref.current?.click(); }}>Choose photo</button></>}
          </div>
          <div className="notice" style={{ marginTop: 16 }}>For a useful view, try natural light and include the affected leaves. Make sure the main symptom is in focus.</div>
        </div>
      </div>

      <div className="form-stack">
        <div className="card" style={{ padding: 22 }}>
          <span className="eyebrow">02 — A little context</span>
          <div className="field" style={{ marginTop: 18 }}><label htmlFor="plantName">Plant name <span className="subtle">(optional)</span></label><input id="plantName" name="plantName" maxLength={100} placeholder="e.g. Monstera, if you know it"/></div>
          <div className="field" style={{ marginTop: 16 }}><label htmlFor="plantCategory">Plant type</label><select id="plantCategory" name="plantCategory" defaultValue=""><option value="">Choose a category</option><option>Houseplant</option><option>Garden plant</option><option>Tree or shrub</option><option>Herb or vegetable</option><option>Not sure</option></select></div>
          <div className="field" style={{ marginTop: 16 }}><label htmlFor="symptomDescription">What have you noticed?</label><textarea id="symptomDescription" name="symptomDescription" maxLength={2000} placeholder="When did it start? Which leaves are affected? Any recent changes to light or watering?"/></div>
        </div>
        <div className="notice"><strong>Private photo storage</strong><br/>Your photo is stored with your account and sent to Google Gemini for analysis.</div>
        {failure && <div className="analysis-error" role="alert"><strong>{failure.title}</strong><p>{failure.message}</p>{(failure.code || failure.requestId) && <small className="analysis-diagnostic">{failure.code && `Code: ${failure.code}`}{failure.code && failure.requestId && ' · '}{failure.requestId && `Request ID: ${failure.requestId}`}</small>}<button type="submit" className="text-button" disabled={busy}>Try again</button></div>}
        <div className="form-footer"><button className="button" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="analysis-spinner" size={16}/> Analyzing your plant…</> : <>Analyze and save <Sparkles size={15}/></>}</button>{file && <span className="field-hint">Photo ready: {file.name}</span>}</div>
      </div>

      <div className="card results-placeholder" style={{ gridColumn: '1/-1' }}><span className="eyebrow">What a report can include</span><div className="feature-grid" style={{ marginTop: 12 }}>{[['Plant identification', 'Common and scientific names, when identifiable.'], ['Possible symptoms', 'Visible clues with supporting observations.'], ['Care suggestions', 'Treatment and prevention ideas, with uncertainty clearly stated.']].map(([title, description]) => <div className="placeholder-block" key={title}><h3>{title}</h3><p>{description}</p></div>)}</div><p className="field-hint" style={{ marginTop: 15 }}><Leaf size={13} style={{ verticalAlign: 'middle' }}/> A photo-based suggestion is not a guaranteed diagnosis.</p></div>
    </form>

    {busy && <div className="analysis-loading-backdrop" role="presentation"><section ref={loadingRef} tabIndex={-1} className="analysis-loading" role="dialog" aria-modal="true" aria-labelledby="analysis-loading-title" aria-describedby="analysis-loading-description"><span className="analysis-loader-icon" aria-hidden="true"><Leaf size={31}/></span><span className="eyebrow">A closer look for your plant</span><h2 id="analysis-loading-title" className="serif">We’re analyzing your photo</h2><p id="analysis-loading-description">Saving your image privately and asking Gemini to review the visible clues. This can take up to a minute; please keep this page open.</p><div className="analysis-progress" role="status" aria-live="polite"><LoaderCircle className="analysis-spinner" size={17}/> <span>Analysis in progress</span></div><div className="analysis-progress-track" aria-hidden="true"><span/></div></section></div>}
  </>;
}
