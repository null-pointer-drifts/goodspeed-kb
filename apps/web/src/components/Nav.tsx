'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

export default function Nav() {
  const path = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const link = (href: string, label: string) => (
    <Link
      href={href}
      style={{
        padding: '6px 14px',
        borderRadius: 6,
        fontWeight: 500,
        fontSize: 14,
        background: path === href ? 'var(--primary)' : 'transparent',
        color: path === href ? '#fff' : 'var(--muted)',
      }}
    >
      {label}
    </Link>
  );

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '12px 24px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
    }}>
      <span style={{ fontWeight: 700, fontSize: 16, marginRight: 16 }}>Goodspeed KB</span>
      {link('/documents', 'Documents')}
      {link('/chat', 'Chat')}
      <button
        onClick={handleLogout}
        className="btn-ghost"
        style={{ marginLeft: 'auto', fontSize: 13 }}
      >
        Sign out
      </button>
    </nav>
  );
}
