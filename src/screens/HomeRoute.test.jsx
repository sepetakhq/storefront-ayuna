import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

const config = { brand: { nav: [], heroImages: [], heroStats: [], sections: {} } };
vi.mock('@sepetakhq/storefront-kit/config/ConfigProvider', () => ({ useConfig: () => config }));

const home = { data: { sections: [] }, isPending: false, isError: false };
vi.mock('@sepetakhq/storefront-kit/hooks/queries', () => ({ useHome: () => home }));

const cart = { items: [], add: vi.fn(), setQty: vi.fn(), remove: vi.fn() };
vi.mock('@sepetakhq/storefront-kit/cart/CartProvider', () => ({ useCart: () => cart }));
vi.mock('@sepetakhq/storefront-kit/ui/ToastProvider', () => ({ useToast: () => vi.fn() }));

const HomeRoute = (await import('./HomeRoute.jsx')).default;

afterEach(cleanup);

function setup(sections, brand = {}) {
  config.brand = { nav: [], heroImages: [], heroStats: [], sections: {}, ...brand };
  home.data = { sections };
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <HomeRoute />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const HERO = { id: 'h', type: 'hero', hero: { title: 'Kecantikan & kesehatan', em: 'untuk dirimu', sub: 'Sub.', cta: 'Belanja sekarang' } };
const FEATURES = {
  id: 'f',
  type: 'features',
  features: { title: 'Janji kami', items: [{ mark: '✅', title: 'Original', body: 'Dari brand resmi' }, { mark: '', title: 'Kirim cepat', body: '' }] },
};
const PRODUCTS = [
  { id: 'p1', slug: 'a', name: 'Serum', price: 132300, compare_at_price: 189000, on_sale: true, stock: 5, availability: 'available' },
];

describe('HomeRoute', () => {
  it('invites the buyer to the catalogue when nothing is published', () => {
    setup([]);
    expect(screen.getByText('Toko sedang disiapkan')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Lihat katalog' })).toBeTruthy();
  });

  it('treats a page of empty sections as empty', () => {
    setup([{ id: 'x', type: 'video-hero' }, { id: 'f', type: 'features', features: { title: 'T', items: [] } }]);
    expect(screen.getByText('Toko sedang disiapkan')).toBeTruthy();
  });

  it('renders the hero without a picture: the shop initial stands in, no stats means no badge', () => {
    const { container } = setup([HERO], { wordmark_primary: 'Ayuna', wordmark_accent: 'Beauty' });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('untuk dirimu');
    expect(screen.getByText('A')).toBeTruthy();
    expect(container.querySelector('dl')).toBeNull();
    expect(screen.getByRole('link', { name: /Belanja sekarang/ }).getAttribute('href')).toBe('/katalog');
  });

  it('puts the first stat on the picture and the rest under the buttons', () => {
    setup([HERO], {
      heroStats: [
        { value: '100%', label: 'Produk original' },
        { value: '12rb+', label: 'Pembeli puas' },
      ],
    });
    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getByText('12rb+').tagName).toBe('DD');
    expect(screen.getByText('Pembeli puas').tagName).toBe('DT');
  });

  it('lifts features straight after the hero, and titles them only when they stand alone', () => {
    const { container } = setup([HERO, FEATURES]);
    expect(container.querySelector('.ay-hero.lifted')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Janji kami' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Janji kami' })).toBeTruthy();

    cleanup();
    const plain = setup([HERO, { id: 'c', type: 'cats', cats: [{ key: 'wajah', label: 'Wajah' }] }, FEATURES]);
    expect(plain.container.querySelector('.ay-hero.lifted')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Janji kami' })).toBeTruthy();
  });

  it('draws a feature mark as given, and a sparkle when there is none', () => {
    const { container } = setup([FEATURES]);
    expect(screen.getByText('✅')).toBeTruthy();
    expect(container.querySelectorAll('.ay-feature svg')).toHaveLength(1);
  });

  it('links categories into the catalogue filter, with initials for a missing picture', () => {
    setup([{ id: 'c', type: 'cats', cats: [{ key: 'wajah', label: 'Perawatan Wajah', subtitle: 'Serum & pelembap' }] }]);
    expect(screen.getByRole('link', { name: /Perawatan Wajah/ }).getAttribute('href')).toBe('/katalog?cat=wajah');
    expect(screen.getByText('PW')).toBeTruthy();
    expect(screen.getByText('Serum & pelembap')).toBeTruthy();
  });

  it('phrases the campaign headline and shows the countdown only inside a week', () => {
    const soon = new Date(Date.now() + 54 * 3600 * 1000).toISOString();
    const far = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    setup([{ id: 'c', type: 'campaign', campaign: { badge: 'Promo terbatas', title: 'Brand pilihan', discount_type: 'percentage', discount_value: 30, ends_at: soon, products: PRODUCTS } }]);
    expect(screen.getByRole('heading', { name: 'Diskon hingga 30%' })).toBeTruthy();
    expect(screen.getByText('Brand pilihan')).toBeTruthy();
    expect(screen.getByRole('timer')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Belanja promo/ }).getAttribute('href')).toBe('/katalog?sale=1');

    cleanup();
    setup([{ id: 'c', type: 'campaign', campaign: { title: 'Brand pilihan', discount_type: 'percentage', discount_value: 30, ends_at: far, products: PRODUCTS } }]);
    expect(screen.queryByRole('timer')).toBeNull();
  });

  it('keeps a campaign with no products and no end as text alone', () => {
    setup([{ id: 'c', type: 'campaign', campaign: { title: 'Gratis ongkir', discount_type: 'free_shipping', ends_at: null, products: [] } }]);
    expect(screen.getByRole('heading', { name: 'Gratis ongkir' })).toBeTruthy();
    expect(screen.queryByRole('timer')).toBeNull();
  });

  it('skips an empty grid and renders a filled one', () => {
    setup([
      { id: 'g0', type: 'grid', grid: { title: 'Kosong', products: [] } },
      { id: 'g1', type: 'grid', grid: { title: 'Paling laris', products: PRODUCTS } },
    ]);
    expect(screen.queryByText('Kosong')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Paling laris' })).toBeTruthy();
    expect(screen.getAllByTestId('product-card')).toHaveLength(1);
  });

  it('sends the story to the about page with the merchant copy', () => {
    setup([{ id: 's', type: 'story', story: { title: 'Sejak 2019', text: 'Kami mulai kecil.' } }], {
      sections: { story_eyebrow: 'Cerita kami', story_cta: 'Kenali Ayuna' },
    });
    expect(screen.getByText('Cerita kami')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Kenali Ayuna/ }).getAttribute('href')).toBe('/tentang');
  });

  it('takes the hero second button, campaign button and headline from the shop', () => {
    const soon = new Date(Date.now() + 5 * 3600 * 1000).toISOString();
    setup(
      [HERO, { id: 'c', type: 'campaign', campaign: { title: 'Brand pilihan', headline: 'Hemat akhir bulan', discount_type: 'percentage', discount_value: 30, ends_at: soon, products: PRODUCTS } }],
      { sections: { hero_secondary_cta: 'Lihat kategori', campaign_cta: 'Lihat semua promo' } },
    );
    expect(screen.getByRole('link', { name: /Lihat kategori/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Lihat semua promo/ }).getAttribute('href')).toBe('/katalog?sale=1');
    expect(screen.getByRole('heading', { name: 'Hemat akhir bulan' })).toBeTruthy();
    expect(screen.getByText('Brand pilihan')).toBeTruthy();
    expect(screen.queryByText('Jelajahi kategori')).toBeNull();
  });

  it('keeps its own words where the shop left a label blank', () => {
    setup([HERO, { id: 'c', type: 'campaign', campaign: { title: 'Brand pilihan', headline: '', discount_type: 'percentage', discount_value: 30, products: PRODUCTS } }], {
      sections: { hero_secondary_cta: '  ', campaign_cta: '' },
    });
    expect(screen.getByRole('link', { name: /Jelajahi kategori/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Belanja promo/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Diskon hingga 30%' })).toBeTruthy();
  });

  it('does not repeat a headline the shop set equal to the title', () => {
    setup([{ id: 'c', type: 'campaign', campaign: { title: 'Promo Gajian', headline: 'Promo Gajian', products: PRODUCTS } }]);
    expect(screen.getAllByText('Promo Gajian')).toHaveLength(1);
  });
});
