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

  it('draws no column for what the shop has not got', () => {
    setup({ nav: [], address_line1: '', social_links: [] });
    config.paymentMethods = [];
    config.couriers = [];
    cleanup();
    render(<MemoryRouter><Footer /></MemoryRouter>);
    for (const t of ['Toko', 'Kontak', 'Pembayaran', 'Pengiriman']) expect(screen.queryByText(t)).toBeNull();
  });
});
