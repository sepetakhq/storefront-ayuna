import { Link } from 'react-router-dom';

import { Img, SIZES } from '../ui/Img.jsx';
import { useConfig } from '@sepetakhq/storefront-kit/config/ConfigProvider';
import { paragraphs } from '@sepetakhq/storefront-kit/shared/format';

import { sectionText } from '../lib/copy.js';

const cardTitle = { fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ay-pink-ink)' };

export default function About() {
  const { brand } = useConfig();
  // Already resolved by the API: a merchant who has not chosen a portrait gets
  // the hero this page has always borrowed, and the choice between the two is
  // not the storefront's to make.
  const portrait = brand.aboutImage;
  const name = [brand.wordmark_primary, brand.wordmark_accent].filter(Boolean).join(' ');
  // The heading and the shop's name are the same string for most shops, so an
  // unset title renders the wordmark rather than an empty h1.
  const title = brand.aboutTitle || name;
  const story = paragraphs(brand.aboutBody);
  // The page's name in the breadcrumb is what the shop calls it in its nav.
  const crumb = brand.nav?.find((n) => n.path === '/tentang')?.label || sectionText(brand.sections, 'story_cta');

  // Each card only when the merchant filled it in: three headings over
  // nothing read as a broken page, not a quiet one.
  const address = [brand.address_line1, brand.address_line2].filter(Boolean);
  const contact = [brand.phone, brand.email].filter(Boolean);
  const cards = [
    address.length && { title: sectionText(brand.sections, 'about_address_heading'), lines: address },
    brand.opening_hours && { title: sectionText(brand.sections, 'about_hours_heading'), lines: [brand.opening_hours] },
    contact.length && { title: sectionText(brand.sections, 'about_contact_heading'), lines: contact },
  ].filter(Boolean);

  return (
    <main aria-label={`Tentang ${title}`}>
      <section className="ay-pagehead" style={{ paddingTop: 40, paddingBottom: 64 }}>
        <div className="ay-inner" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <nav aria-label="Breadcrumb" className="ay-crumbs">
            <Link to="/">Beranda</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{crumb}</span>
          </nav>
          <div className="ay-split-420">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 580 }}>
              <div className="ay-eyebrow">{sectionText(brand.sections, 'story_eyebrow')}</div>
              <h1 style={{ margin: 0, fontSize: 'clamp(34px, 4.2vw, 52px)', lineHeight: 1.06, fontWeight: 800, letterSpacing: '-0.035em', textWrap: 'balance' }}>{title}</h1>
              {/*
                Text nodes, never dangerouslySetInnerHTML. The body is copy a
                merchant typed into the backoffice, and the shortest path from
                "let them use bold" to "let them inject a script" runs through
                exactly this element.
              */}
              {story.map((para, i) => (
                <p key={i} style={{ margin: 0, fontSize: 17, lineHeight: 1.75, color: 'var(--ay-body)', textWrap: 'pretty' }}>
                  {para}
                </p>
              ))}
              {brand.whatsapp_url && (
                <a href={brand.whatsapp_url} target="_blank" rel="noopener noreferrer" className="ay-btn ay-btn-primary" style={{ alignSelf: 'flex-start', marginTop: 6 }}>
                  {brand.whatsapp_text || 'Chat WhatsApp'}
                </a>
              )}
            </div>
            <Img
              src={portrait?.url}
              srcSet={portrait?.srcset}
              alt={portrait?.alt || name}
              ratio="4/5"
              radius={32}
              sizes={SIZES.hero}
              style={{ background: '#FBD9E6', maxHeight: 560, width: '100%' }}
              fallback={
                <div aria-hidden="true" style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 30% 25%, #FFF3F7 0%, #FBD9E6 60%, #F6C3D6 100%)' }}>
                  <span style={{ fontSize: 140, fontWeight: 800, color: '#fff', opacity: 0.85 }}>{(name || '·').charAt(0).toUpperCase()}</span>
                </div>
              }
            />
          </div>
        </div>
      </section>

      {cards.length > 0 && (
        <section style={{ padding: '48px var(--ay-gutter) 0' }}>
          <div className="ay-inner" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {cards.map((c, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid var(--ay-line)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={cardTitle}>{c.title}</div>
                <div style={{ fontSize: 16, lineHeight: 1.6, fontWeight: 600, overflowWrap: 'anywhere' }}>
                  {c.lines.map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
