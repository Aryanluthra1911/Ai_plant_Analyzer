'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { History, LayoutDashboard, Leaf, LoaderCircle, LogOut, Menu, Settings, Sparkles, Sprout, X } from 'lucide-react';

const navigation = [
  { label: 'My garden', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Analyze a plant', href: '/analyze', icon: Sparkles },
  { label: 'Analysis history', href: '/history', icon: History },
  { label: 'Plant profiles', href: '/plants', icon: Sprout },
  { label: 'Plant care', href: '/care', icon: Sprout },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function AppSidebar({ user }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut({ callbackUrl: '/' });
    setSigningOut(false);
  }

  const brand = <Link href="/dashboard" className="brand app-sidebar-brand" onClick={() => setOpen(false)}><span className="brand-mark"><Leaf size={17}/></span> verdant</Link>;

  return <>
    <div className="app-mobile-bar">
      <button type="button" className="icon-button app-menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X size={20}/> : <Menu size={20}/>}</button>
      {brand}
      <Link href="/analyze" className="icon-button app-mobile-create" aria-label="Analyze a plant"><Sparkles size={18}/></Link>
    </div>
    {open && <button className="app-sidebar-backdrop" type="button" aria-label="Close navigation" onClick={() => setOpen(false)}/>}
    <aside className={`app-sidebar ${open ? 'is-open' : ''}`}>
      {brand}
      <p className="app-sidebar-label">YOUR WORKSPACE</p>
      <nav aria-label="Garden navigation" className="app-sidebar-nav">
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
          return <Link key={href} href={href} onClick={() => setOpen(false)} className={`app-sidebar-link ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}><Icon size={18}/><span>{label}</span>{href === '/analyze' && <span className="sidebar-link-arrow">+</span>}</Link>;
        })}
      </nav>
      <div className="app-sidebar-bottom">
        <div className="app-user-card"><span className="app-user-avatar">{user?.name?.trim()?.[0]?.toUpperCase() || 'P'}</span><span className="app-user-copy"><strong>{user?.name || 'Plant person'}</strong><small>Private garden</small></span></div>
        <button type="button" className="app-sidebar-link app-signout" onClick={handleSignOut} disabled={signingOut}>{signingOut ? <LoaderCircle className="analysis-spinner" size={18}/> : <LogOut size={18}/>}<span>{signingOut ? 'Signing out…' : 'Log out'}</span></button>
      </div>
    </aside>
  </>;
}
