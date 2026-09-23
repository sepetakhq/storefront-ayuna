import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { useConfig } from '@sepetakhq/storefront-kit/config/ConfigProvider';
import { useCart } from '@sepetakhq/storefront-kit/cart/CartProvider';

import { BrandMark } from './BrandMark.jsx';

const WORDMARK = { primary: '#1B1530', accent: '#E0336F', size: 24 };

/**
 * The sticky header. At ≥1180px one row: mark, the merchant's nav, search,
 * "Pesanan saya" and the cart. Narrower, the nav and search move into a
 * panel under the row (CSS decides which, not a width listener), and the
 * panel always carries order tracking even when the merchant's nav does not.
 */
export default function Header() {
  const { brand } = useConfig();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const { pathname, search } = useLocation();
  const headerRef = useRef(null);
  const searchRef = useRef(null);

  // Any navigation closes the panel; leaving it open over a new screen is
  // the classic mobile-nav bug.
  useEffect(() => setOpen(false), [pathname, search]);

  useEffect(() => {
    if (!open) return undefined;
    document.body.setAttribute('data-menu', '1');
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onDown = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.body.removeAttribute('data-menu');
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open]);

  const openSearch = () => {
    setOpen(true);
    // After the panel renders.
    setTimeout(() => searchRef.current?.focus(), 0);
  };

  const hasTrack = brand.nav.some((n) => n.path === '/lacak');

  return (
    <header className="ay-header" ref={headerRef}>
      <div className="ay-header-row">
        <Link to="/" aria-label="Beranda" style={{ display: 'flex', alignItems: 'center', minWidth: 0, color: 'var(--ay-text)' }}>
          <BrandMark height={40} maxWidth={200} wordmark={WORDMARK} tagline={brand.tagline_short} />
        </Link>

        <nav className="ay-nav" aria-label="Navigasi utama">
          {brand.nav.map((n) => (
            <NavLink key={n.path} to={n.path} end={n.path === '/'}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div className="ay-only-wide">
            <SearchBox />
          </div>
          <button type="button" className="ay-icon-btn ay-only-narrow" aria-label="Cari produk" onClick={openSearch}>
            <SearchGlyph size={22} />
          </button>
          <Link to="/lacak" className="ay-icon-btn ay-only-wide" aria-label="Pesanan saya" title="Pesanan saya">
            <PersonGlyph />
          </Link>
          <Link to="/keranjang" className="ay-cart" aria-label={`Keranjang, ${count} barang`}>
            <CartGlyph />
            {count > 0 && <span className="ay-cart-count">{count > 99 ? '99+' : count}</span>}
          </Link>
          <button
            type="button"
            className="ay-menu-btn"
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
            aria-controls="ay-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseGlyph /> : <MenuGlyph />}
          </button>
        </div>
      </div>

      {open && (
        <div id="ay-menu" className="ay-menu-panel">
          <SearchBox inputRef={searchRef} />
          {brand.nav.map((n) => (
            <NavLink key={n.path} to={n.path} end={n.path === '/'}>
              {n.label}
            </NavLink>
          ))}
          {!hasTrack && <NavLink to="/lacak">Lacak pesanan</NavLink>}
        </div>
      )}
    </header>
  );
}

/**
 * The search box submits to /katalog?q=. It reads the live param so the box
 * shows what the results are for, and is blank everywhere else.
 */
export function SearchBox({ inputRef }) {
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const current = pathname === '/katalog' ? params.get('q') ?? '' : '';
  const [value, setValue] = useState(current);
  useEffect(() => setValue(current), [current]);

  const submit = (e) => {
    e.preventDefault();
    const q = value.trim();
    navigate(q ? `/katalog?q=${encodeURIComponent(q)}` : '/katalog');
  };

  return (
    <form role="search" onSubmit={submit} className="ay-search">
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Cari produk…"
        aria-label="Cari produk"
        maxLength={80}
      />
      <button type="submit" aria-label="Cari">
        <SearchGlyph size={18} />
      </button>
    </form>
  );
}

function SearchGlyph({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function PersonGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

export function CartGlyph({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 4h2l2.4 11.2a1 1 0 001 .8h9.2a1 1 0 001-.8L20 8H6.2" />
      <circle cx="9" cy="20" r="1.3" />
      <circle cx="17" cy="20" r="1.3" />
    </svg>
  );
}

function MenuGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
