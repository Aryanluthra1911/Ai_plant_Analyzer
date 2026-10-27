import './globals.css';
import { Toaster } from 'sonner';
import SiteHeader from '@/components/SiteHeader';
import { auth } from '@/auth';

export const metadata = { title: 'Verdant — Understand your plants', description: 'Thoughtful plant care, grounded in what you can see.' };
export default async function RootLayout({ children }) {
  const session = await auth();
  return <html lang="en"><body><SiteHeader session={session} /><main>{children}</main><Toaster position="top-center" richColors /><footer className="footer"><div className="footer-inner"><a className="brand" href="/"><span className="brand-mark">v.</span> verdant</a><p>Good care begins with a closer look.</p><div><a href="/care">Plant care</a><a href="/settings">Settings</a><a href="/privacy">Privacy</a></div><small>© 2026 Verdant Plant Journal</small></div></footer></body></html>;
}
