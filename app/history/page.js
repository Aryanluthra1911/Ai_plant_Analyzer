import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AnalysisHistory from '@/components/AnalysisHistory';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 12;

export default async function History({ searchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=%2Fhistory');
  const params = await searchParams;
  const query = (typeof params?.q === 'string' ? params.q : '').trim().slice(0, 100);
  const requestedStatus = typeof params?.status === 'string' ? params.status : '';
  const statusFilter = ['completed', 'needs_better_image', 'uploaded'].includes(requestedStatus) ? requestedStatus : '';
  const requestedPage = Number.parseInt(params?.page || '1', 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, Math.min(10_000, requestedPage)) : 1;
  const where = {
    userId: session.user.id,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(query ? { OR: [
      { plantName: { contains: query, mode: 'insensitive' } },
      { plantCategory: { contains: query, mode: 'insensitive' } },
      { symptomDescription: { contains: query, mode: 'insensitive' } },
    ] } : {}),
  };
  const total = await prisma.plantAnalysis.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const analyses = await prisma.plantAnalysis.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (safePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: { id: true, plantName: true, plantCategory: true, symptomDescription: true, status: true, createdAt: true },
  });
  return <div className="page-wrap"><span className="eyebrow">Your private garden journal</span><AnalysisHistory analyses={analyses.map(item => ({ ...item, createdAt: item.createdAt.toISOString() }))} query={query} statusFilter={statusFilter} page={safePage} totalPages={totalPages} total={total} /></div>;
}
