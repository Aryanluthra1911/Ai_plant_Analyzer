'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf } from 'lucide-react';
const links = [['My garden','/dashboard'],['Plant care','/care'],['History','/history']];
export default function SiteHeader(){const path=usePathname(); return <header className="site-header"><Link href="/" className="brand"><span className="brand-mark"><Leaf size={18}/></span> verdant</Link><nav>{links.map(([name,url])=><Link key={url} className={path===url?'active':''} href={url}>{name}</Link>)}</nav><div className="header-actions"><Link href="/login" className="quiet-link">Log in</Link><Link href="/analyze" className="button button-small">Analyze a plant <span>↗</span></Link></div></header>}
