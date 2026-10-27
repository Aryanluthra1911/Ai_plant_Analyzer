export default function ReportLoading() {
  return <div className="page-wrap page-skeleton report-skeleton" aria-busy="true" aria-label="Loading plant analysis">
    <span className="skeleton-block skeleton-eyebrow"/><span className="skeleton-block skeleton-title"/>
    <div className="skeleton-grid skeleton-report-overview"><span className="skeleton-block skeleton-report-photo"/><span className="skeleton-block skeleton-report-card"/></div>
    <div className="skeleton-grid skeleton-report-details"><span className="skeleton-block skeleton-card"/><span className="skeleton-block skeleton-card"/></div>
  </div>;
}
