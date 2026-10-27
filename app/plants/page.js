import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PlantProfiles from '@/components/PlantProfiles';

export const dynamic = 'force-dynamic';

export default async function PlantsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=%2Fplants');
  const profiles = await prisma.plantProfile.findMany({ where: { userId: session.user.id }, orderBy: { updatedAt: 'desc' }, select: { id: true, name: true, species: true, category: true, location: true, _count: { select: { analyses: true } } } });
  return <div className="page-wrap plants-page"><PlantProfiles profiles={profiles}/></div>;
}
