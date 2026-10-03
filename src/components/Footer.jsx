import { Link } from 'react-router-dom';

import { useConfig } from '@sepetakhq/storefront-kit/config/ConfigProvider';

import { sectionText, socialLabel } from '../lib/copy.js';

const colTitle = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ay-ink)',
};
const chip = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 30,
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--ay-ink)',
  background: '#fff',
  border: '1px solid var(--ay-line-2)',
  borderRadius: 8,
  padding: '6px 10px',
};

/**
 * Four columns from config alone: the name and tagline, the merchant's
 * links, contact, and the payment methods and couriers the shop actually
 * offers. A column with nothing to list is not drawn, so a bare new shop
 * gets a short footer rather than headings over nothing.
 */
export default function Footer() {
  const { brand, paymentMethods, couriers } = useConfig();
  const payments = (paymentMethods ?? []).filter((m) => m.enabled && m.name);
  const shipping = (couriers ?? []).filter((c) => c.enabled && c.name);
  const socials = (brand.social_links ?? []).filter((s) => s.url);
  const address = [brand.address_line1, brand.address_line2].filter(Boolean);
  const hasContact = address.length > 0 || brand.opening_hours || brand.email || brand.whatsapp_url;

  return (
    <footer style={{ marginTop: 88, background: '#FFF5F9', borderTop: '1px solid #F6DCE5' }}>
      <div className="ay-wrap" style={{ paddingTop: 56, paddingBottom: 28, display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 36 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
              {brand.wordmark_primary} <span style={{ color: 'var(--ay-pink)' }}>{brand.wordmark_accent}</span>
            </div>
            {brand.tagline && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ay-body)' }}>{brand.tagline}</p>}
          </div>

          {brand.nav.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={colTitle}>{sectionText(brand.sections, 'footer_shop_heading')}</div>
              {brand.nav.map((n) => (
                <Link key={n.path} to={n.path} className="hv-pink" style={{ fontSize: 14, color: 'var(--ay-body)' }}>
                  {n.label}
                </Link>
              ))}
            </div>
          )}

          {hasContact && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: 'var(--ay-body)', lineHeight: 1.5 }}>
              <div style={colTitle}>{sectionText(brand.sections, 'footer_contact_heading')}</div>
              {address.length > 0 && (
                <div>
                  {address.map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </div>
              )}
              {brand.opening_hours && <div>{brand.opening_hours}</div>}
              {brand.email && (
                <a href={`mailto:${brand.email}`} style={{ color: 'var(--ay-body)' }}>
                  {brand.email}
                </a>
              )}
              {brand.whatsapp_url && (
                <a
                  href={brand.whatsapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hv-primary"
                  style={{ marginTop: 4, alignSelf: 'flex-start', minHeight: 40, padding: '0 16px', borderRadius: 999, background: 'var(--ay-ink)', color: '#fff', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <ChatGlyph />
                  {/* The merchant's button text ("Teks tombol WhatsApp"), else the number. */}
                  <span>{brand.whatsapp_text || (brand.phone ? `Chat ${brand.phone}` : 'Chat WhatsApp')}</span>
                </a>
              )}
            </div>
          )}

          {(payments.length > 0 || shipping.length > 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {payments.length > 0 && (
                <>
                  <div style={colTitle}>{sectionText(brand.sections, 'footer_payment_heading')}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {chips(payments).map((m) => (
                      <Chip key={m.code} item={m} />
                    ))}
                  </div>
                </>
              )}
              {shipping.length > 0 && (
                <>
                  <div style={{ ...colTitle, marginTop: payments.length ? 8 : 0 }}>{sectionText(brand.sections, 'footer_shipping_heading')}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {chips(shipping).map((c, i) => (
                      <Chip key={`${c.code}-${i}`} item={c} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', paddingTop: 20, borderTop: '1px solid var(--ay-line-2)', fontSize: 13, color: 'var(--ay-muted)' }}>
          <span>{brand.copyright || ''}</span>
          {socials.length > 0 && (
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {socials.map((s, i) => (
                <a key={`${s.kind}-${i}`} href={s.url} target="_blank" rel="noopener noreferrer" className="hv-pink" style={{ color: 'var(--ay-body)', fontWeight: 600 }}>
                  {socialLabel(s.kind)}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

/**
 * One chip per badge: "VA BCA" and "Transfer BCA", or JNE REG and JNE YES,
 * are the same mark to a buyer checking whether the shop takes their bank or
 * ships with their courier. A name the platform has no badge for stays text.
 */
export function chips(items) {
  const seen = new Set();
  return items.filter((x) => !x.logo_url || (!seen.has(x.logo_url) && seen.add(x.logo_url)));
}

function Chip({ item }) {
  if (!item.logo_url) return <span style={chip}>{item.name}</span>;
  return (
    <span className="ay-logo-chip" style={chip} title={item.name}>
      <img src={item.logo_url} alt={item.name} loading="lazy" />
    </span>
  );
}

export function ChatGlyph({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 01-13.3 7.9L3 21l1.2-4.5A9 9 0 1121 12z" />
    </svg>
  );
}
