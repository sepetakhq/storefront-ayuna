// The decisions behind this template's chrome, kept pure so they can be
// tested without a DOM. The kit owns the platform rules (stock, sale
// windows, variants); this file owns what ayuna does with them.

import { saleState, overlayLabel, AVAILABLE } from '@sepetakhq/storefront-kit/lib/availability';
import { countsStock, isSoldOut, leadDays, maxQty, shortNote } from '@sepetakhq/storefront-kit/lib/preorder';
import { fmt, formatQty } from '@sepetakhq/storefront-kit/shared/format';
import { unitScale } from '@sepetakhq/storefront-kit/shared/qty';

/**
 * Percent off, or 0 when there is nothing honest to say: no compare price,
 * a compare price at or under the sale price, or a product not on sale.
 * Never divides by zero.
 */
export function discountPct(p) {
  const price = Number(p?.price ?? 0);
  const compare = Number(p?.compare_at_price ?? 0);
  if (!p?.on_sale || !(compare > 0) || !(compare > price)) return 0;
  return Math.round((1 - price / compare) * 100);
}

/** Two letters for a tile with no picture: "Serum Vitamin" → "SV", "Makeup" → "MA". */
export function initials(label) {
  const words = String(label ?? '')
    .split(/[\s&/·-]+/)
    .filter(Boolean);
  if (words.length === 0) return '·';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Blush washes from the design, keyed by a stable hash so the same category
// always gets the same one without the merchant choosing.
const TINTS = ['#FDEEF3', '#FCE3ED', '#FFF1F6', '#FBE7EF', '#FDEBF2', '#FFF4F8'];

export function tintFor(key) {
  const s = String(key ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

/**
 * What the card's action area shows for this product:
 *   variants  — a link to the page, never a variant-less line
 *   disabled  — sold out, scheduled or ended; the label is the kit's buyLabel
 *   stepper   — already in the cart; −/+ against `max`
 *   add       — one tap adds one
 */
export function quickAddState(p, lineQty = 0) {
  if (!p) return { kind: 'disabled', max: 0 };
  if (p.has_variants && !isSoldOut(p)) return { kind: 'variants', max: 0 };
  if (saleState(p) !== AVAILABLE || isSoldOut(p)) return { kind: 'disabled', max: 0 };
  const max = maxQty(p);
  return lineQty > 0 ? { kind: 'stepper', max } : { kind: 'add', max };
}

/**
 * The orange line under a card's name: the pre-order wait, or "only N left"
 * when a counted stock is nearly gone. Nothing otherwise.
 */
export const LOW_STOCK = 5;
export function cardNote(p) {
  if (!p) return '';
  if (p.preorder) return shortNote(p) || 'Pre-order';
  if (!countsStock(p) || isSoldOut(p) || saleState(p) !== AVAILABLE) return '';
  const n = Number(p.stock ?? 0);
  return n > 0 && n <= LOW_STOCK * unitScale(p.unit) ? `Sisa ${formatQty(n, p.unit)} lagi` : '';
}

/**
 * The product page's orange line, for the product as judged for the picked
 * variant: the pre-order wait, or a nearly-gone counted stock.
 */
export function detailNote(p) {
  if (!p) return '';
  if (p.preorder) {
    const days = leadDays(p);
    return days ? `Pre-order · dikirim ±${days} hari setelah pembayaran` : 'Pre-order · dibuat setelah pembayaran';
  }
  if (!countsStock(p) || isSoldOut(p)) return '';
  const n = Number(p.stock ?? 0);
  return n > 0 && n <= LOW_STOCK * unitScale(p.unit) ? `Sisa ${formatQty(n, p.unit)} lagi — segera checkout` : '';
}

/** "Pilih warna dulu" / "Pilih ukuran & warna dulu", for the axes still open. */
export function pickPrompt(options, selected) {
  const open = (options ?? []).map((o) => o.name).filter((n) => !selected?.[n]);
  return open.length ? `Pilih ${open.map((n) => n.toLowerCase()).join(' & ')} dulu` : 'Pilih varian dulu';
}

/**
 * The veil over a card's picture when it cannot be bought now, in the
 * design's sentence case: sold out, opening later, or closed.
 */
export function cardVeil(p) {
  const o = overlayLabel(p);
  if (!o) return isSoldOut(p) ? 'Stok habis' : '';
  if (o.title === 'SEGERA') return o.detail ? `Buka ${o.detail}` : 'Segera hadir';
  if (o.title === 'SUDAH DITUTUP') return 'Penjualan ditutup';
  return 'Stok habis';
}

/** "stok 24" only when a number means something. */
export function stockLine(p) {
  if (!p || !countsStock(p) || isSoldOut(p)) return '';
  const n = Number(p.stock ?? 0);
  return n > 0 ? `stok ${n}` : '';
}

/**
 * A running campaign's countdown is worth drawing for a week out; beyond
 * that "43 HARI" is noise, not urgency.
 */
export const COUNTDOWN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export function showCountdown(endsAt, now = Date.now()) {
  if (!endsAt) return false;
  const t = new Date(endsAt).getTime();
  if (Number.isNaN(t)) return false;
  const left = t - now;
  return left > 0 && left <= COUNTDOWN_WINDOW_MS;
}

/**
 * The campaign's big line: what the promotion takes off, in the design's
 * words, or the merchant's title for a kind this template cannot phrase.
 */
export function campaignHeadline(c) {
  const own = String(c?.headline ?? '').trim();
  if (own) return own;
  const v = Number(c?.discount_value ?? 0);
  if (v > 0 && c?.discount_type === 'percentage') return `Diskon hingga ${v}%`;
  if (v > 0 && c?.discount_type === 'fixed') return `Hemat ${fmt(v)}`;
  return c?.title ?? '';
}

/** The API's two banner tones, in this template's colours. */
export function bannerBg(name) {
  return name === 'pink'
    ? { background: 'linear-gradient(110deg,#E8538A 0%,#D62A66 50%,#B81C55 100%)', color: '#FFFFFF', button: 'ay-btn-light' }
    : { background: '#FFF1F6', color: '#1B1530', button: 'ay-btn-primary' };
}

/**
 * The hero draws its first stat as the badge on the picture and the rest
 * as a row under the buttons, so a single stat does not leave an empty row.
 */
export function splitStats(stats) {
  const list = (stats ?? []).filter((s) => s?.value || s?.label);
  return { badge: list[0] ?? null, row: list.slice(1, 4) };
}

/**
 * A features section straight after the hero lifts into the hero's bottom
 * edge; anywhere else it is a plain tinted strip.
 */
export function liftsIntoHero(sections, i) {
  return i > 0 && sections?.[i]?.type === 'features' && sections[i - 1]?.type === 'hero';
}

/**
 * The template's own wording for every section_copy label it draws. The
 * merchant's text from the backoffice replaces each one; blank keeps these.
 */
export const DEFAULT_LABELS = {
  cats_heading: 'Belanja per kategori',
  grid_see_all: 'Lihat semua',
  story_eyebrow: 'Cerita kami',
  story_cta: 'Selengkapnya',
  product_details_heading: 'Detail bahan & ukuran',
  product_care_heading: 'Cara perawatan',
  product_shipping_heading: 'Pengiriman',
  hero_secondary_cta: 'Jelajahi kategori',
  campaign_cta: 'Belanja promo',
  related_heading: 'Kamu mungkin juga suka',
  product_ask_label: 'Tanya produk ini via WhatsApp',
  product_ask_message: 'Halo, saya mau tanya tentang {product}',
  promo_title: 'Promo',
  promo_subtitle: 'Produk yang sedang diskon',
  about_address_heading: 'Alamat toko',
  about_hours_heading: 'Jam buka',
  about_contact_heading: 'Hubungi kami',
  footer_shop_heading: 'Toko',
  footer_contact_heading: 'Kontak',
  footer_payment_heading: 'Pembayaran',
  footer_shipping_heading: 'Pengiriman',
};

/**
 * One label: the merchant's section_copy text, trimmed, else the template's.
 * `copy` is the config's substitution, for labels that may carry
 * {free_shipping_min}; a sentence it withholds falls back too, rather than
 * leaving the slot blank.
 */
export function sectionText(sections, key, copy) {
  const raw = String(sections?.[key] ?? '').trim();
  const text = raw && copy ? String(copy(raw) ?? '').trim() : raw;
  return text || DEFAULT_LABELS[key] || '';
}

/** The WhatsApp question with {product} filled in; other braces stay as typed. */
export function askMessage(template, productName) {
  return String(template ?? '').replaceAll('{product}', String(productName ?? ''));
}

/**
 * The "ask about this product" link: the shop's WhatsApp URL with the
 * message set through URL, so a merchant URL that already carries a query
 * keeps it. Anything that is not an http(s) URL gives no link at all.
 */
export function askLink(whatsappUrl, message) {
  if (!whatsappUrl) return '';
  let url;
  try {
    url = new URL(whatsappUrl);
  } catch {
    return '';
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
  if (message) url.searchParams.set('text', message);
  return url.toString();
}

const SOCIAL_NAMES = { instagram: 'Instagram', whatsapp: 'WhatsApp', tiktok: 'TikTok', facebook: 'Facebook' };
/** A social kind as a word; one this bundle predates is capitalised as-is. */
export function socialLabel(kind) {
  const k = String(kind ?? '');
  return SOCIAL_NAMES[k] ?? (k ? k[0].toUpperCase() + k.slice(1) : '');
}

/** The catalogue heading for the active filters. */
export function catalogTitle({ cat, sale, q } = {}, categories = [], promoTitle = DEFAULT_LABELS.promo_title) {
  if (q) return `Hasil untuk “${q}”`;
  if (sale) return promoTitle;
  if (cat && cat !== 'Semua') {
    const found = categories.find((c) => c.key === cat);
    return found?.label ?? cat;
  }
  return 'Semua produk';
}

/**
 * The chip row under the catalogue heading: all, each category, promo. A
 * chip is a link to that one filter; the sort the buyer chose rides along.
 */
export function catalogChips(categories = [], { cat, sale, q } = {}, sort = 'featured', promoTitle = DEFAULT_LABELS.promo_title) {
  const href = (params) => {
    const qs = new URLSearchParams(params);
    if (sort && sort !== 'featured') qs.set('sort', sort);
    const s = qs.toString();
    return s ? `/katalog?${s}` : '/katalog';
  };
  const active = sale ? '__sale' : cat && cat !== 'Semua' ? cat : q ? '__q' : '__all';
  return [
    { key: '__all', label: 'Semua', to: href({}) },
    ...categories.map((c) => ({ key: c.key, label: c.label, to: href({ cat: c.key }) })),
    { key: '__sale', label: promoTitle, to: href({ sale: '1' }) },
  ].map((c) => ({ ...c, current: c.key === active }));
}

export const SORTS = [
  { value: 'featured', label: 'Paling relevan' },
  { value: 'priceAsc', label: 'Harga terendah' },
  { value: 'priceDesc', label: 'Harga tertinggi' },
  { value: 'nameAsc', label: 'Nama A–Z' },
];

export function sortOrDefault(value) {
  return SORTS.some((s) => s.value === value) ? value : 'featured';
}
