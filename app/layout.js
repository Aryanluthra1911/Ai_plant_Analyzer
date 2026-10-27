import './globals.css';
import { Toaster } from 'sonner';
import SiteHeader from '@/components/SiteHeader';
import AppSidebar from '@/components/AppSidebar';
import Link from 'next/link';
import { auth } from '@/auth';

export const metadata = { title: 'Verdant — Understand your plants', description: 'Thoughtful plant care, grounded in what you can see.' };
export default async function RootLayout({ children }) {
  const session = await auth();
  const signedIn = Boolean(session?.user?.id);
  return <html lang="en"><body className={signedIn ? 'signed-in-body' : 'public-body'}>
    {signedIn ? <div className="app-shell">
      <AppSidebar user={session.user}/>
      <div className="app-workspace">
        <header className="app-topbar"><div><span className="eyebrow">YOUR PRIVATE GARDEN</span><p>Thoughtful care, one observation at a time.</p></div><Link href="/analyze" className="button button-pill"><span>New analysis</span><span aria-hidden="true">＋</span></Link></header>
        <main className="app-main">{children}</main>
        <footer className="app-footer"><span>Good care begins with a closer look.</span><Link href="/privacy">Privacy</Link><span>© 2026 Verdant</span></footer>
      </div>
    </div> : <>
      <SiteHeader/>
      <main>{children}</main>
      <footer className="footer"><div className="footer-inner"><a className="brand" href="/"><span className="brand-mark">v.</span> verdant</a><p>Good care begins with a closer look.</p><div><a href="/care">Plant care</a><a href="/privacy">Privacy</a></div><small>© 2026 Verdant Plant Journal</small></div></footer>
    </>}
    <Toaster position="top-center" richColors/>
  </body></html>;
}
