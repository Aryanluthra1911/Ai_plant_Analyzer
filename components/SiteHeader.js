'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Leaf, Menu, X, ArrowUpRight } from 'lucide-react';

const links = [['How it works','/#how-it-works'],['Plant care','/care'],['Our approach','/privacy']];

export default function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return <header className="site-header">
    <Link href="/" className="brand" onClick={() => setOpen(false)}><span className="brand-mark"><Leaf size={18}/></span> verdant</Link>
    <nav className={`public-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">{links.map(([name, url]) => <Link key={url} className={path === url ? 'active' : ''} href={url} onClick={() => setOpen(false)}>{name}</Link>)}</nav>
    <div className="header-actions"><Link href="/login" className="quiet-link">Log in</Link><Link href="/analyze" className="button button-small button-pill">Analyze a plant <ArrowUpRight size={15}/></Link><button type="button" className="icon-button site-nav-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X size={20}/> : <Menu size={20}/>}</button></div>
  </header>;
}
