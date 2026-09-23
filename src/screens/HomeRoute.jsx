import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { useConfig } from '@sepetakhq/storefront-kit/config/ConfigProvider';
import { useHome } from '@sepetakhq/storefront-kit/hooks/queries';
import { qk } from '@sepetakhq/storefront-kit/api/queryKeys';
import { serverNow } from '@sepetakhq/storefront-kit/api/client';
import { fmt } from '@sepetakhq/storefront-kit/shared/format';

import ProductCard from '../components/ProductCard.jsx';
import { Tile } from '../components/Tile.jsx';
import { Img, SIZES } from '../ui/Img.jsx';
import { CountdownCells } from '../ui/Countdown.jsx';
import { EmptyState, ErrorState, ProductGridSkeleton, Skeleton } from '../ui/states.jsx';
import { bannerBg, campaignHeadline, discountPct, liftsIntoHero, sectionText, showCountdown, splitStats } from '../lib/copy.js';

/**
 * The home page is the section list the merchant published, in order. A
 * features section straight after the hero lifts into it as the design's
 * floating strip; everywhere else sections stand on their own.
 */
export default function HomeRoute() {
  const { data, isPending, isError, error, refetch } = useHome();

  if (isPending) return <HomeSkeleton />;
  if (isError) {
    return (
      <div className="ay-wrap" style={{ paddingTop: 60 }}>
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }
  const sections = (data?.sections ?? []).filter(renders);
  if (sections.length === 0) return <EmptyHome />;

  return (
    <main>
      {sections.map((sec, i) => (
        <Section key={sec.id ?? i} sec={sec} lifted={liftsIntoHero(sections, i)} liftNext={liftsIntoHero(sections, i + 1)} sections={sections} />
      ))}
    </main>
  );
}

/**
 * Whether a section has anything to draw. Decided before rendering so the
 * hero-then-features lift is judged on what is actually on the page: an
 * empty features list must not leave the hero padded for a strip that
 * never comes.
 */
function renders(sec) {
  switch (sec?.type) {
    case 'hero':
      return Boolean(sec.hero?.title);
    case 'features':
      return Boolean(sec.features?.items?.length);
    case 'cats':
      return Boolean(sec.cats?.length);
    case 'campaign':
      return Boolean(sec.campaign);
    case 'grid':
    case 'carousel':
      return Boolean(sec.grid?.products?.length);
    case 'story':
      return Boolean(sec.story?.title);
    case 'banner':
      return Boolean(sec.banner?.text);
    default:
      // A type this bundle predates: skipped, the way the resolver skips one
      // it does not know.
      return false;
  }
}

function Section({ sec, lifted, liftNext, sections }) {
  switch (sec.type) {
    case 'hero':
      return <Hero hero={sec.hero} liftNext={liftNext} hasCats={sections.some((s) => s.type === 'cats')} />;
    case 'features':
      return <Features features={sec.features} lifted={lifted} />;
    case 'cats':
      return <Categories cats={sec.cats} />;
    case 'campaign':
      return <Campaign campaign={sec.campaign} />;
    case 'grid':
    case 'carousel':
      return <Grid grid={sec.grid} />;
    case 'story':
      return <Story story={sec.story} />;
    case 'banner':
      return <Banner banner={sec.banner} />;
    default:
      return null;
  }
}

/* --- hero ---------------------------------------------------------------- */

function Hero({ hero, liftNext, hasCats }) {
  const { brand } = useConfig();
  const picture = brand.heroImages?.[0];
  const { badge, row } = splitStats(brand.heroStats);
  const name = [brand.wordmark_primary, brand.wordmark_accent].filter(Boolean).join(' ');

  const toCats = (e) => {
    const el = document.getElementById('kategori');
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  return (
    <section className={`ay-hero${liftNext ? ' lifted' : ''}`}>
      <div className="ay-inner ay-split">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 26, minWidth: 0 }}>
          {brand.hero_eyebrow && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #F4CFDC', borderRadius: 999, padding: '8px 16px', fontSize: 14, fontWeight: 600, color: 'var(--ay-pink-ink)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#F2A33A" aria-hidden="true">
                <path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z" />
              </svg>
              <span>{brand.hero_eyebrow}</span>
            </div>
          )}
          <h1 style={{ margin: 0, fontSize: 'clamp(34px, 5.2vw, 62px)', lineHeight: 1.04, fontWeight: 800, letterSpacing: '-0.035em', textWrap: 'balance', overflowWrap: 'anywhere' }}>
            {hero.title} {hero.em && <span style={{ color: 'var(--ay-pink)' }}>{hero.em}</span>}
          </h1>
          {hero.sub && <p style={{ margin: 0, fontSize: 18, lineHeight: 1.6, color: 'var(--ay-body)', maxWidth: 480, textWrap: 'pretty' }}>{hero.sub}</p>}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/katalog" className="ay-btn ay-btn-primary" style={{ minHeight: 56, padding: '0 28px', borderRadius: 14, fontSize: 16, boxShadow: '0 10px 24px rgba(224,51,111,0.3)' }}>
              <span>{hero.cta || 'Belanja sekarang'}</span>
              <ArrowGlyph size={20} />
            </Link>
            <Link to="/katalog" onClick={hasCats ? toCats : undefined} className="ay-btn ay-btn-ghost" style={{ minHeight: 56, padding: '0 24px', borderRadius: 14 }}>
              <span>{sectionText(brand.sections, 'hero_secondary_cta')}</span>
              <GridGlyph />
            </Link>
          </div>
          {row.length > 0 && (
            <dl style={{ display: 'flex', gap: '16px 36px', flexWrap: 'wrap', margin: 0, paddingTop: 6 }}>
              {row.map((s, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column-reverse', gap: 2 }}>
                  <dt style={{ fontSize: 13, color: 'var(--ay-muted)' }}>{s.label}</dt>
                  <dd style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: 560, justifySelf: 'center' }}>
          <Img
            src={picture?.url}
            srcSet={picture?.srcset}
            sizes={SIZES.hero}
            alt={picture?.alt ?? ''}
            ratio="1/1"
            radius={36}
            priority
            style={{ background: '#FBD9E6' }}
            fallback={
              <div aria-hidden="true" style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 30% 25%, #FFF3F7 0%, #FBD9E6 55%, #F6C3D6 100%)' }}>
                <span style={{ fontSize: 'clamp(96px, 18vw, 180px)', fontWeight: 800, color: '#fff', opacity: 0.85, letterSpacing: '-0.04em' }}>
                  {(name || '·').charAt(0).toUpperCase()}
                </span>
              </div>
            }
          />
          {badge && (
            <div
              style={{
                position: 'absolute',
                right: 16,
                bottom: 24,
                width: 'clamp(116px, 28vw, 150px)',
                height: 'clamp(116px, 28vw, 150px)',
                borderRadius: 999,
                background: '#fff',
                boxShadow: '0 20px 40px rgba(177,40,92,0.18)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                textAlign: 'center',
                padding: 16,
              }}
            >
              <LotusGlyph />
              <div style={{ fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, overflowWrap: 'anywhere' }}>{badge.value}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ay-body)', lineHeight: 1.3 }}>{badge.label}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* --- features ----------------------------------------------------------- */

function Features({ features, lifted }) {
  const items = (
    <div className="ay-features">
      {features.items.map((it, i) => (
        <div key={i} className="ay-feature">
          <Mark mark={it.mark} size={lifted ? 48 : 44} bg={lifted ? '#FDEBF2' : '#fff'} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <div style={{ fontSize: lifted ? 16 : 15, fontWeight: 700 }}>{it.title}</div>
            {it.body && <div style={{ fontSize: 13, color: 'var(--ay-muted)', lineHeight: 1.4 }}>{it.body}</div>}
          </div>
        </div>
      ))}
    </div>
  );

  if (lifted) {
    return (
      <section style={{ padding: '0 var(--ay-gutter)', marginTop: -56, position: 'relative', zIndex: 2 }} aria-label={features.title}>
        <div className="ay-inner" style={{ background: '#fff', border: '1px solid #F6DCE5', borderRadius: 24, boxShadow: '0 18px 40px rgba(177,40,92,0.08)', padding: '28px var(--ay-gutter)' }}>
          {items}
        </div>
      </section>
    );
  }
  return (
    <section style={{ padding: '64px var(--ay-gutter) 0' }}>
      <div className="ay-inner" style={{ background: '#FFF1F6', borderRadius: 24, padding: '26px var(--ay-gutter)' }}>
        {features.title && <h2 style={{ margin: '0 0 18px', fontSize: 20, fontWeight: 700 }}>{features.title}</h2>}
        {items}
      </div>
    </section>
  );
}

/**
 * The merchant's mark: an emoji or up to four characters (the API caps it),
 * drawn in the design's rounded square. No mark gets a sparkle rather than
 * an empty box.
 */
function Mark({ mark, size, bg }) {
  const text = String(mark ?? '').trim();
  return (
    <span aria-hidden="true" style={{ width: size, height: size, flex: 'none', borderRadius: 14, background: bg, color: 'var(--ay-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: text.length > 2 ? 14 : 22, fontWeight: 800 }}>
      {text || (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
        </svg>
      )}
    </span>
  );
}

/* --- categories --------------------------------------------------------- */

function Categories({ cats }) {
  const { brand } = useConfig();
  const copy = brand.sections ?? {};
  return (
    <section id="kategori" className="ay-section" style={{ scrollMarginTop: 100 }}>
      <div className="ay-inner">
        <div className="ay-head">
          <h2 className="ay-h2">{sectionText(copy, 'cats_heading')}</h2>
          <Link to="/katalog" className="ay-see-all">
            <span>{sectionText(copy, 'grid_see_all')}</span>
            <ArrowGlyph size={16} />
          </Link>
        </div>
        <div className="ay-cats">
          {cats.map((c) => (
            <Link key={c.key} to={`/katalog?cat=${encodeURIComponent(c.key)}`} className="ay-cat">
              <Img src={c.image} srcSet={c.image_srcset} sizes={SIZES.categoryTile} alt="" ratio="1/0.9" style={{ background: '#FDEEF3' }} fallback={<Tile label={c.label} tintKey={c.key} size={30} />} />
              <span style={{ padding: '16px 12px 18px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{c.label}</span>
                {c.subtitle && <span style={{ fontSize: 13, color: 'var(--ay-muted)' }}>{c.subtitle}</span>}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --- campaign ----------------------------------------------------------- */

function Campaign({ campaign }) {
  const qc = useQueryClient();
  const { brand } = useConfig();
  const products = (campaign.products ?? []).slice(0, 3);
  const ticking = showCountdown(campaign.ends_at, serverNow());
  const headline = campaignHeadline(campaign);
  // The title is the sentence under the headline, unless it already is the
  // headline because the discount could not be phrased.
  const sub = headline === campaign.title ? '' : campaign.title;

  return (
    <section className="ay-section">
      <div
        className="ay-inner"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 28,
          background: 'linear-gradient(110deg,#E8538A 0%,#D62A66 50%,#B81C55 100%)',
          color: '#fff',
          padding: 'clamp(24px, 5vw, 48px)',
          display: 'grid',
          gridTemplateColumns: products.length ? 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))' : '1fr',
          gap: 40,
          alignItems: 'center',
        }}
      >
        <span aria-hidden="true" style={{ position: 'absolute', right: -120, top: -120, width: 360, height: 360, borderRadius: 999, background: 'rgba(255,255,255,0.08)' }} />
        <span aria-hidden="true" style={{ position: 'absolute', right: 120, bottom: -160, width: 280, height: 280, borderRadius: 999, background: 'rgba(255,255,255,0.06)' }} />
        {products.length > 0 && (
          <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 14px)', alignItems: 'flex-end', position: 'relative', minWidth: 0 }}>
            {products.map((p) => (
              <MiniCard key={p.id} p={p} />
            ))}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14, position: 'relative', minWidth: 0 }}>
          {campaign.badge && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFD27A" aria-hidden="true">
                <path d="M12 2c1 4 5 5.5 5 11a5 5 0 01-10 0c0-2.5 1.2-4 2.5-5 .2 2 1 3 2 3 0-3-1-6.5.5-9z" />
              </svg>
              <span>{campaign.badge}</span>
            </div>
          )}
          <h2 style={{ margin: 0, fontSize: 'clamp(34px, 4.4vw, 56px)', lineHeight: 1, fontWeight: 800, letterSpacing: '-0.035em', overflowWrap: 'anywhere' }}>{headline}</h2>
          {sub && <p style={{ margin: 0, fontSize: 18, fontWeight: 500, lineHeight: 1.45, textWrap: 'pretty' }}>{sub}</p>}
          {ticking && (
            <div style={{ marginTop: 4 }}>
              <CountdownCells until={campaign.ends_at} onExpire={() => qc.invalidateQueries({ queryKey: qk.home })} />
            </div>
          )}
          <Link to="/katalog?sale=1" className="ay-btn ay-btn-light" style={{ marginTop: 8 }}>
            <span>{sectionText(brand.sections, 'campaign_cta')}</span>
            <ArrowGlyph size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function MiniCard({ p }) {
  const off = discountPct(p);
  return (
    <Link
      to={`/produk/${p.slug}`}
      style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: 18, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 14px 30px rgba(80,10,40,0.2)', color: 'var(--ay-text)' }}
    >
      <span style={{ position: 'relative', display: 'block', borderRadius: 12, overflow: 'hidden' }}>
        <Img src={p.image} srcSet={p.image_srcset} sizes="160px" alt="" ratio="4/5" style={{ background: '#FFF4F8' }} fallback={<Tile label={p.name} tintKey={p.category_key} size={20} />} />
        {off > 0 && <span className="ay-tag ay-tag-sale" style={{ position: 'absolute', top: 8, left: 8 }}>-{off}%</span>}
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: 31 }}>{p.name}</span>
      <span style={{ fontSize: 14, fontWeight: 800 }}>{fmt(p.price)}</span>
    </Link>
  );
}

/* --- grid --------------------------------------------------------------- */

function Grid({ grid }) {
  const { brand } = useConfig();
  return (
    <section className="ay-section">
      <div className="ay-inner">
        <div className="ay-head">
          <h2 className="ay-h2">{grid.title || 'Produk'}</h2>
          <Link to="/katalog" className="ay-see-all">
            <span>{sectionText(brand.sections, 'grid_see_all')}</span>
            <ArrowGlyph size={16} />
          </Link>
        </div>
        <div className="ay-grid">
          {grid.products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* --- story -------------------------------------------------------------- */

function Story({ story }) {
  const { brand } = useConfig();
  const copy = brand.sections ?? {};
  const portrait = brand.aboutImage;
  const name = [brand.wordmark_primary, brand.wordmark_accent].filter(Boolean).join(' ');
  return (
    <section className="ay-section">
      <div className="ay-inner ay-split-420">
        <Img
          src={portrait?.url}
          srcSet={portrait?.srcset}
          sizes={SIZES.hero}
          alt={portrait?.alt ?? ''}
          ratio="4/3"
          radius={28}
          style={{ background: '#FDEEF3' }}
          fallback={
            <div aria-hidden="true" style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 70% 30%, #FFF4F8 0%, #FCE3ED 60%, #F8D2E1 100%)' }}>
              <span style={{ fontSize: 96, fontWeight: 800, color: '#fff', opacity: 0.9 }}>{(name || '·').charAt(0).toUpperCase()}</span>
            </div>
          }
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16, maxWidth: 520 }}>
          <div className="ay-eyebrow">{sectionText(copy, 'story_eyebrow')}</div>
          <h2 style={{ margin: 0, fontSize: 'clamp(30px, 3.4vw, 42px)', lineHeight: 1.1, fontWeight: 800, letterSpacing: '-0.03em', textWrap: 'balance' }}>{story.title}</h2>
          {story.text && <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: 'var(--ay-body)', textWrap: 'pretty' }}>{story.text}</p>}
          <Link to="/tentang" className="ay-btn ay-btn-dark" style={{ marginTop: 6 }}>
            <span>{sectionText(copy, 'story_cta')}</span>
            <ArrowGlyph size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* --- banner ------------------------------------------------------------- */

function Banner({ banner }) {
  const tone = bannerBg(banner.bg);
  return (
    <section className="ay-section">
      <div className="ay-inner" style={{ borderRadius: 24, padding: '28px clamp(20px, 4vw, 36px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', background: tone.background, color: tone.color }}>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 700, maxWidth: 720, textWrap: 'pretty' }}>{banner.text}</p>
        {banner.cta && (
          <Link to="/katalog" className={`ay-btn ${tone.button}`} style={{ minHeight: 46 }}>
            {banner.cta}
          </Link>
        )}
      </div>
    </section>
  );
}

/* --- glyphs ------------------------------------------------------------- */

function ArrowGlyph({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function GridGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#E0336F" aria-hidden="true">
      {[5, 12, 19].flatMap((y) => [5, 12, 19].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" />))}
    </svg>
  );
}

function LotusGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#E0336F" aria-hidden="true">
      <path d="M12 3c2 3 2 6 0 9-2-3-2-6 0-9zM4 9c3.5 0 6 2 8 5-3.5.5-6.5-1.5-8-5zm16 0c-1.5 3.5-4.5 5.5-8 5 2-3 4.5-5 8-5zM12 21c-3 0-6-2-7-5 3 0 5.5 1.5 7 5zm0 0c1.5-3.5 4-5 7-5-1 3-4 5-7 5z" />
    </svg>
  );
}

/* --- states ------------------------------------------------------------- */

function EmptyHome() {
  return (
    <div className="ay-wrap" style={{ paddingTop: 60 }}>
      <EmptyState
        title="Toko sedang disiapkan"
        body="Halaman depan belum diisi. Katalognya sudah bisa dilihat."
        action={
          <Link to="/katalog" className="ay-btn ay-btn-primary">
            Lihat katalog
          </Link>
        }
      />
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div aria-busy="true">
      <div style={{ background: 'linear-gradient(180deg,#FCE3ED 0%,#FFF3F7 100%)', height: 420 }} />
      <div className="ay-wrap" style={{ paddingTop: 48 }}>
        <Skeleton height={28} width={260} />
        <div style={{ marginTop: 16 }}>
          <ProductGridSkeleton count={5} />
        </div>
      </div>
    </div>
  );
}
