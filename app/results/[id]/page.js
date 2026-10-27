import Link from 'next/link';
import { ArrowLeft, Leaf, ShieldAlert } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import ReportActions from '@/components/ReportActions';

export const dynamic = 'force-dynamic';

function ListCard({ title, items, emptyText, className = '' }) {
  return <section className={`card report-card ${className}`}>
    <h2>{title}</h2>
    {items.length ? <ul>{items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</ul> : <p className="report-empty">{emptyText}</p>}
  </section>;
}

export default async function AnalysisReport({ params }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=%2Fhistory');
  const { id } = await params;
  const analysis = await prisma.plantAnalysis.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, plantName: true, plantCategory: true, symptomDescription: true, imageMimeType: true, imageSize: true, status: true, createdAt: true, result: true, plantProfile: { select: { id: true, name: true } } },
  });
  if (!analysis) notFound();

  const report = analysis.result;
  const identification = report?.plantIdentification;
  const suitable = report?.imageAssessment?.status === 'suitable';
  const diseases = report?.possibleDiseases || [];
  const deficiencies = report?.nutrientDeficiencies || [];
  const pests = report?.potentialPests || [];
  const imageUrl = `/api/analyses/${encodeURIComponent(analysis.id)}/image`;

  return <div className="page-wrap report-page">
    <Link className="report-back-link" href="/history"><ArrowLeft size={16}/> Back to history</Link>
    <div className="report-heading">
      <div><span className="eyebrow">Saved plant analysis · {new Date(analysis.createdAt).toLocaleDateString()}</span><h1 className="page-title serif">{identification?.commonName || analysis.plantName || 'Plant observation'}</h1><p className="subtle report-subtitle">{analysis.plantCategory || 'Plant category not specified'} <span aria-hidden="true">·</span> {Math.round(analysis.imageSize / 1024)} KB</p></div>
    </div>
    <ReportActions analysisId={analysis.id} imageUrl={imageUrl} plantName={identification?.commonName || analysis.plantName || ''} currentProfileId={analysis.plantProfile?.id}/>
    {analysis.plantProfile && <p className="report-linked-profile">Saved in <Link href={`/plants/${analysis.plantProfile.id}`}>{analysis.plantProfile.name} profile ↗</Link></p>}

    <section className="report-overview-grid" aria-label="Plant photo and identification">
      <figure className="report-photo-card card"><img src={imageUrl} alt={`Saved photo of ${identification?.commonName || analysis.plantName || 'your plant'}`}/><figcaption><Leaf size={15}/> Original photo analyzed</figcaption></figure>
      <div className="report-intro-stack">
        <section className="card plant-identification-card">
          <div className="report-card-heading"><span className="eyebrow">PLANT IDENTIFICATION</span><span className={`report-status ${suitable ? 'is-suitable' : ''}`}>{report ? suitable ? 'Image clear' : 'Needs another look' : 'Awaiting report'}</span></div>
          {report ? <><h2>{identification?.commonName || 'Plant not identified'}</h2><p className="report-scientific">{identification?.scientificName || 'Scientific name unavailable'}</p><div className="identification-facts"><span><small>Confidence</small><strong>{identification?.confidence || 'unknown'}</strong></span><span><small>Image check</small><strong>{report.imageAssessment?.status || 'not assessed'}</strong></span></div></> : <><h2>Analysis report unavailable</h2><p className="report-scientific">This saved photo does not have a completed report.</p></>}
          {analysis.plantName && <p className="report-user-context"><strong>Your plant name:</strong> {analysis.plantName}</p>}
        </section>
        <section className="card report-summary-card"><span className="eyebrow">AT A GLANCE</span>{report ? <><h2>{report.summary}</h2>{analysis.symptomDescription && <p className="report-user-note"><strong>Your note</strong><br/>{analysis.symptomDescription}</p>}</> : <><h2>This photo has not been analyzed.</h2><p>No diagnosis or care recommendation is available for this saved photo.</p><Link className="link-arrow" href="/analyze">Try an analysis again <ArrowUpRight size={15}/></Link></>}<div className="report-disclaimer"><ShieldAlert size={16}/><span>{report?.disclaimer || 'Photo-based suggestions are not a guaranteed diagnosis.'}</span></div></section>
      </div>
    </section>

    {report && <>
      <section className="report-observation card"><div><span className="eyebrow">PHOTO CHECK</span><h2>{report.imageAssessment?.status === 'suitable' ? 'What the image shows' : 'Why another photo may help'}</h2></div><p>{report.imageAssessment?.notes || 'Image quality was not reported.'}</p></section>
      <div className="report-details-grid">
        <section className="card report-card disease-card"><h2>Possible disease signs</h2>{diseases.length ? diseases.map((item, index) => <article className="report-finding" key={`${item.name}-${index}`}><div className="report-finding-heading"><h3>{item.name}</h3><span>{item.likelihood} likelihood · {item.severity} severity</span></div><p><strong>Visible symptoms:</strong> {item.symptoms?.join('; ') || 'No clear symptoms confirmed.'}</p><p><strong>Supporting evidence:</strong> {item.visualEvidence?.join('; ') || 'No distinct visual evidence reported.'}</p><p><strong>Possible causes:</strong> {item.possibleCauses?.join('; ') || 'Not determined.'}</p></article>) : <p className="report-empty">{suitable ? 'No specific disease signs were identified in this photo.' : 'No disease assessment was made because the image needs another look.'}</p>}</section>
        {deficiencies.length > 0 && <section className="card report-card"><h2>Possible nutrient deficiencies</h2>{deficiencies.map((item, index) => <article className="report-finding" key={`${item.name}-${index}`}><h3>{item.name} <span>· {item.likelihood} likelihood</span></h3><p>{item.visualEvidence?.join('; ')}</p><p><strong>Possible causes:</strong> {item.possibleCauses?.join('; ')}</p></article>)}</section>}
        {pests.length > 0 && <section className="card report-card"><h2>Potential pest signs</h2>{pests.map((item, index) => <article className="report-finding" key={`${item.name}-${index}`}><h3>{item.name} <span>· {item.likelihood} likelihood</span></h3><p><strong>Visible evidence:</strong> {item.visualEvidence?.join('; ')}</p><p><strong>Possible damage:</strong> {item.possibleDamage?.join('; ')}</p></article>)}</section>}
        <ListCard title="Treatment ideas" items={report.treatment || []} emptyText={suitable ? 'No treatment was suggested from this photo.' : 'Treatment was not assessed for this image.'}/>
        <ListCard title="Prevention" items={report.prevention || []} emptyText={suitable ? 'No specific prevention steps were identified.' : 'Prevention was not assessed for this image.'}/>
        <section className="card report-card care-card-report"><h2>Plant care guidance</h2><dl>{Object.entries(report.care || {}).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></section>
        <section className="card report-card"><h2>What would help next</h2>{report.additionalInformationNeeded?.length ? <ul>{report.additionalInformationNeeded.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="report-empty">No extra information requested.</p>}<div className="report-uncertainty"><strong>Uncertainty</strong><p>{report.uncertainty}</p></div></section>
      </div>
    </>}
  </div>;
}
