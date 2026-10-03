import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const config = {};
vi.mock('@sepetakhq/storefront-kit/config/ConfigProvider', () => ({ useConfig: () => config }));

const Footer = (await import('./Footer.jsx')).default;

afterEach(cleanup);

function setup(brand = {}) {
  Object.assign(config, {
    paymentMethods: [{ code: 'QRIS', name: 'QRIS', enabled: true }, { code: 'OFF', name: 'Mati', enabled: false }],
    couriers: [{ code: 'jne', name: 'JNE', enabled: true }],
    brand: {
      nav: [{ route: 'home', path: '/', label: 'Beranda' }],
      wordmark_primary: 'Ayuna',
      address_line1: 'Jl. Riau 18',
      social_links: [{ kind: 'tiktok', url: 'https://tiktok.com/@a' }],
      ...brand,
    },
  });
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );
}

describe('Footer', () => {
  it('uses its own column titles when the shop set none', () => {
    setup({ sections: {} });
    for (const t of ['Toko', 'Kontak', 'Pembayaran', 'Pengiriman']) expect(screen.getByText(t)).toBeTruthy();
    expect(screen.queryByText('Mati')).toBeNull();
    expect(screen.getByRole('link', { name: 'TikTok' })).toBeTruthy();
  });

  it('uses the shop\'s column titles', () => {
    setup({ sections: { footer_shop_heading: 'Menu', footer_contact_heading: 'Hubungi', footer_payment_heading: 'Bayar', footer_shipping_heading: 'Kurir' } });
    for (const t of ['Menu', 'Hubungi', 'Bayar', 'Kurir']) expect(screen.getByText(t)).toBeTruthy();
    expect(screen.queryByText('Pembayaran')).toBeNull();
  });

  it('labels the WhatsApp button with the shop\'s text, else the number', () => {
    setup({ whatsapp_url: 'https://wa.me/628', phone: '0812', whatsapp_text: 'Chat kami' });
    expect(screen.getByRole('link', { name: 'Chat kami' })).toBeTruthy();
    cleanup();
    setup({ whatsapp_url: 'https://wa.me/628', phone: '0812', whatsapp_text: '' });
    expect(screen.getByRole('link', { name: 'Chat 0812' })).toBeTruthy();
  });

  it("draws the server's badge in place of a name, once per badge, and keeps names it has none for", () => {
    const bca = 'http://api.test/logos/payment/bca.svg';
    const jne = 'http://api.test/logos/courier/jne.svg';
    setup({});
    config.paymentMethods = [
      { code: 'BCA', name: 'VA BCA', enabled: true, logo_url: bca },
      { code: 'MANUAL_BCA', name: 'Transfer BCA', enabled: true, logo_url: bca },
      { code: 'MANUAL_BANK_1', name: 'Transfer SeaBank', enabled: true },
    ];
    config.couriers = [
      { code: 'toko', name: 'Kurir Toko', enabled: true },
      { code: 'jne', name: 'JNE REG', enabled: true, logo_url: jne },
      { code: 'jne', name: 'JNE YES', enabled: true, logo_url: jne },
    ];
    cleanup();
    const { container } = render(<MemoryRouter><Footer /></MemoryRouter>);
    const imgs = [...container.querySelectorAll('.ay-logo-chip img')];
    expect(imgs.map((i) => i.getAttribute('src'))).toEqual([bca, jne]);
    // The first name behind a badge is how it is read aloud.
    expect(screen.getByRole('img', { name: 'VA BCA' })).toBeTruthy();
    expect(screen.queryByRole('img', { name: 'Transfer BCA' })).toBeNull();
    expect(screen.getByText('Transfer SeaBank')).toBeTruthy();
    expect(screen.getByText('Kurir Toko')).toBeTruthy();
  });

  it('draws no column for what the shop has not got', () => {
    setup({ nav: [], address_line1: '', social_links: [] });
    config.paymentMethods = [];
    config.couriers = [];
    cleanup();
    render(<MemoryRouter><Footer /></MemoryRouter>);
    for (const t of ['Toko', 'Kontak', 'Pembayaran', 'Pengiriman']) expect(screen.queryByText(t)).toBeNull();
  });
});
