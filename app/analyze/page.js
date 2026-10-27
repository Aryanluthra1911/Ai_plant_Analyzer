import Analyzer from '@/components/Analyzer';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AnalyzePage(){
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=%2Fanalyze');
  return <div className="page-wrap"><span className="eyebrow">A closer look</span><h1 className="page-title serif">Let’s look at your plant.</h1><p className="subtle" style={{maxWidth:550,marginBottom:32}}>Upload a plant photo and a little context for a private, cautious visual assessment. Reports explain uncertainty and do not replace expert diagnosis.</p><Analyzer/></div>
}
