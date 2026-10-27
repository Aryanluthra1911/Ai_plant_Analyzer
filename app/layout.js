import './globals.css';
import { Toaster } from 'sonner';
import SiteHeader from '@/components/SiteHeader';

export const metadata = { title: 'Verdant — Understand your plants', description: 'Thoughtful plant care, grounded in what you can see.' };
export default function RootLayout({ children }) {
  return <html lang="en"><body><SiteHeader /><main>{children}</main><Toaster position="top-center" richColors /><footer className="footer"><div className="footer-inner"><a className="brand" href="/"><span className="brand-mark">v.</span> verdant</a><p>Good care begins with a closer look.</p><div><a href="/care">Plant care</a><a href="/settings">Settings</a><a href="/privacy">Privacy</a></div><small>© 2026 Verdant Plant Journal</small></div></footer></body></html>;
}
