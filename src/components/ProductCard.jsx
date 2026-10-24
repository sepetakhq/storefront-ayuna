import { Link } from 'react-router-dom';

import { useCart } from '@sepetakhq/storefront-kit/cart/CartProvider';
import { buyLabel } from '@sepetakhq/storefront-kit/lib/availability';
import { isPriceRange, lineKey } from '@sepetakhq/storefront-kit/lib/variants';
import { useToast } from '@sepetakhq/storefront-kit/ui/ToastProvider';
import { fmt, formatQty } from '@sepetakhq/storefront-kit/shared/format';
import { qtyLimits, stepQty } from '@sepetakhq/storefront-kit/shared/qty';

import { Img, SIZES } from '../ui/Img.jsx';
import { Tile } from './Tile.jsx';
import { cardNote, cardVeil, discountPct, quickAddState } from '../lib/copy.js';

/**
 * The design's card: square picture (or initials) with the discount and the
 * merchant's badge on it, category, name, the orange note, then price and
 * the action. The picture and the name are links; the action sits outside
 * them so a tap on it never navigates.
 */
export default function ProductCard({ p }) {
  const off = discountPct(p);
  const note = cardNote(p);
  const veil = cardVeil(p);
  const href = `/produk/${p.slug}`;

  return (
    <article className="ay-card" data-testid="product-card">
      <Link to={href} className="ay-card-media" tabIndex={-1} aria-hidden="true">
        <Img
          src={p.image}
          srcSet={p.image_srcset}
          sizes={SIZES.card}
          alt=""
          ratio="1/1"
          style={{ background: '#FFF4F8' }}
          fallback={<Tile label={p.name} tintKey={p.category_key} size={26} />}
        />
        {(off > 0 || p.badge) && (
          <span className="ay-card-tags">
            {off > 0 && <span className="ay-tag ay-tag-sale">-{off}%</span>}
            {p.badge && <span className="ay-tag">{p.badge}</span>}
          </span>
        )}
        {veil && (
          <span className="ay-card-veil">
            <span>{veil}</span>
          </span>
        )}
      </Link>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 4px', minWidth: 0 }}>
        {p.category_label && <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ay-muted)' }}>{p.category_label}</div>}
        <Link to={href} className="ay-card-name">
          {p.name}
        </Link>
        {note && <div className="ay-card-note">{note}</div>}
      </div>
      <div className="ay-card-foot">
        <Price p={p} off={off} />
        <QuickAdd p={p} />
      </div>
    </article>
  );
}

function Price({ p, off }) {
  return (
    <div className="ay-card-price" style={{ display: 'flex', alignItems: 'baseline', gap: '2px 8px', flexWrap: 'wrap', minWidth: 0 }}>
      {isPriceRange(p) && <span style={{ fontSize: 12, color: 'var(--ay-muted)' }}>mulai</span>}
      <span className="ay-price">{fmt(p.price)}</span>
      {off > 0 && <s className="ay-compare">{fmt(p.compare_at_price)}</s>}
    </div>
  );
}

/**
 * The action area, by quickAddState:
 *   add      → one tap adds one and confirms with a toast
 *   stepper  → −/+ around the qty already in the cart, + capped at `max`
 *   variants → a link to the page; a card cannot pick a shade
 *   disabled → the kit's reason (sold out / opens on / ended)
 */
export function QuickAdd({ p }) {
  const cart = useCart();
  // The kit's context value is the function itself, not an object holding it.
  const showToast = useToast();
  const key = lineKey({ productId: p.id, variantId: null });
  const line = cart.items.find((it) => lineKey(it) === key);
  const qty = line?.qty ?? 0;
  const state = quickAddState(p, qty);

  if (state.kind === 'variants') {
    return (
      <Link to={`/produk/${p.slug}`} className="ay-card-btn is-variant" aria-label="Pilih varian">
        <span className="ay-lbl">Pilih varian</span>
        <ChevronGlyph />
      </Link>
    );
  }
  if (state.kind === 'disabled') {
    return (
      <button type="button" className="ay-card-btn" disabled>
        <span className="ay-lbl">{buyLabel(p) ?? 'Stok habis'}</span>
      </button>
    );
  }
  if (state.kind === 'add') {
    const label = p.preorder ? 'Pre-order' : 'Tambah ke keranjang';
    return (
      <button
        type="button"
        className="ay-card-btn is-add"
        aria-label={label}
        onClick={() => {
          cart.add(p, 1, null);
          showToast(`${p.name} masuk keranjang`);
        }}
      >
        <CartGlyph />
        <PlusGlyph />
        <span className="ay-lbl">{label}</span>
      </button>
    );
  }
  return (
    <div className="ay-stepper" role="group" aria-label={`Jumlah ${p.name}`}>
      <button type="button" aria-label="Kurangi" onClick={() => { const n = stepQty(qty, -1, qtyLimits(p)); return n === 0 ? cart.remove(key) : cart.setQty(key, n); }}>
        −
      </button>
      <output aria-live="polite">{formatQty(qty, qtyLimits(p).unit)}</output>
      <button type="button" aria-label="Tambah" disabled={stepQty(qty, 1, qtyLimits(p)) > state.max} onClick={() => cart.setQty(key, stepQty(qty, 1, qtyLimits(p)))}>
        +
      </button>
    </div>
  );
}

function CartGlyph() {
  return (
    <svg className="ay-ico-cart" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 4h2l2.4 11.2a1 1 0 001 .8h9.2a1 1 0 001-.8L20 8H6.2" />
      <circle cx="9" cy="20" r="1.3" />
      <circle cx="17" cy="20" r="1.3" />
    </svg>
  );
}

function PlusGlyph() {
  return (
    <svg className="ay-ico-plus" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ChevronGlyph() {
  return (
    <svg className="ay-ico-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
