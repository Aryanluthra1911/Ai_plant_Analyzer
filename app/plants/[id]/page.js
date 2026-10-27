import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import PlantProfileDetail from '@/components/PlantProfileDetail';

export const dynamic = 'force-dynamic';

export default async function PlantProfilePage({ params }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=%2Fplants');
  const { id } = await params;
  const profile = await prisma.plantProfile.findFirst({ where: { id, userId: session.user.id }, select: { id: true, name: true, species: true, category: true, location: true, notes: true, createdAt: true } });
  if (!profile) notFound();
  const analyses = await prisma.plantAnalysis.findMany({ where: { userId: session.user.id, plantProfileId: profile.id }, orderBy: { createdAt: 'desc' }, select: { id: true, plantName: true, status: true, createdAt: true, result: true } });
  return <div className="page-wrap plants-page"><PlantProfileDetail profile={profile} analyses={analyses.map((analysis) => ({ ...analysis, createdAt: analysis.createdAt.toISOString() }))}/></div>;
}
