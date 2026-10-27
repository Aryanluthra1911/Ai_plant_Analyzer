'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, Leaf, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AnalysisHistory({ analyses, query: initialQuery, statusFilter, page, totalPages, total }) {
  const [query, setQuery] = useState(initialQuery || '');
  const [rows, setRows] = useState(analyses);
  const [deletingId, setDeletingId] = useState(null);
  const router = useRouter();
  const effectiveQuery = query;
  const pageHref = (nextPage) => `/history?${new URLSearchParams({ ...(effectiveQuery ? { q: effectiveQuery } : {}), ...(statusFilter ? { status: statusFilter } : {}), page: String(nextPage) })}`;
  const noResults = useMemo(() => rows.length === 0, [rows]);

  async function deleteAnalysis(id) {
    if (!window.confirm('Delete this saved analysis and its photo? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/analyses/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'The analysis could not be deleted.');
      toast.success('Analysis deleted.');
      const nextRows = rows.filter((item) => item.id !== id);
      setRows(nextRows);
      if (nextRows.length === 0 && page > 1) router.push(pageHref(page - 1));
    } catch (error) {
      toast.error(error.message || 'The analysis could not be deleted.');
    } finally {
      setDeletingId(null);
    }
  }

  return <>
    <div className="section-heading"><div><h1 className="page-title serif">Analysis history</h1><p className="subtle" style={{margin:0}}>Revisit photos you have saved to your account. {total} saved.</p></div><form action="/history" className="searchbox"><Search size={16}/><input aria-label="Search history" name="q" placeholder="Search your history" value={query} onChange={(event)=>setQuery(event.target.value)} maxLength={100}/><select aria-label="Filter by status" name="status" defaultValue={statusFilter} className="history-status-filter"><option value="">All status</option><option value="completed">Complete</option><option value="needs_better_image">Image check</option><option value="uploaded">Pending</option></select><button className="history-search-button" type="submit">Apply</button></form></div>
    <div className="history-list"><div className="history-header"><span>Photo</span><span>Plant</span><span>Notes</span><span>Date</span><span>Status</span></div>
      {!noResults ? rows.map((item)=><div className="history-row" key={item.id}><Link href={`/results/${item.id}`} className="history-row-link"><span className="history-thumb" style={{backgroundImage:`url('/api/analyses/${encodeURIComponent(item.id)}/image')`}}/><span><strong>{item.plantName||'Plant photo'}</strong><p>{item.plantCategory||'Category not specified'}</p></span><span>{item.symptomDescription||'No symptoms noted'}</span><time>{new Date(item.createdAt).toLocaleDateString()}</time><span className="pill">{item.status==='uploaded'?'Awaiting analysis':item.status}</span></Link><button type="button" className="icon-button history-delete" aria-label={`Delete ${item.plantName || 'plant'} analysis`} disabled={deletingId === item.id} onClick={()=>deleteAnalysis(item.id)}><Trash2 size={16}/></button></div>):<div className="empty-state"><Leaf size={25}/><p>{initialQuery?'No saved photos match your search.':'Your history is empty. Saved plant photos will appear here.'}</p></div>}
    </div>
    {totalPages > 1 && <nav className="history-pagination" aria-label="History pages"><Link aria-disabled={page <= 1} className={page <= 1 ? 'disabled' : ''} href={pageHref(Math.max(1, page - 1))}><ChevronLeft size={16}/> Previous</Link><span>Page {page} of {totalPages}</span><Link aria-disabled={page >= totalPages} className={page >= totalPages ? 'disabled' : ''} href={pageHref(Math.min(totalPages, page + 1))}>Next <ChevronRight size={16}/></Link></nav>}
  </>;
}
