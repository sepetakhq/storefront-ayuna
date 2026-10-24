import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { qtyLimits } from '@sepetakhq/storefront-kit/shared/qty';

// The cart and its priced lines are mocked so the line's stepper is what is
// asserted, not the provider plumbing the kit already tests.
const cart = { isEmpty: false, setQty: vi.fn(), remove: vi.fn() };
let lines = [];
vi.mock('@sepetakhq/storefront-kit/cart/CartProvider', () => ({ useCart: () => cart }));
vi.mock('@sepetakhq/storefront-kit/cart/useCartLines', () => ({
  useCartLines: () => ({ lines, statuses: [], subtotal: 0, isLoading: false, hasBlockers: false, preorderLeadDays: 0 }),
}));
vi.mock('@sepetakhq/storefront-kit/config/ConfigProvider', () => ({
  useConfig: () => ({ freeShipping: false, freeShippingMin: 0 }),
}));

const CartRoute = (await import('./CartRoute.jsx')).default;

afterEach(cleanup);
beforeEach(() => {
  cart.setQty.mockClear();
  cart.remove.mockClear();
});

function line(qty, over = {}) {
  const product = { id: 'p1', slug: 'tomat', name: 'Tomat', price: 12000, stock: 5000, availability: 'available', ...over };
  return { key: 'p1:', item: { qty }, product, label: '', status: 'ok', available: 5000, preorder: false, limits: qtyLimits(product) };
}

function show() {
  return render(
    <MemoryRouter>
      <CartRoute />
    </MemoryRouter>,
  );
}

describe('CartRoute line stepper', () => {
  it('prints a kg line in kg and steps it by its step', () => {
    lines = [line(1250, { unit: 'kg', qty_step: 250, qty_min: 500 })];
    show();
    expect(screen.getByText('1,25 kg')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tambah jumlah' }));
    expect(cart.setQty).toHaveBeenCalledWith('p1:', 1500);
    fireEvent.click(screen.getByRole('button', { name: 'Kurangi jumlah' }));
    expect(cart.setQty).toHaveBeenCalledWith('p1:', 1000);
  });

  it('removes a kg line stepped below its minimum', () => {
    lines = [line(500, { unit: 'kg', qty_step: 250, qty_min: 500 })];
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Kurangi jumlah' }));
    expect(cart.remove).toHaveBeenCalledWith('p1:');
    expect(cart.setQty).not.toHaveBeenCalled();
  });

  it('keeps a piece line a bare number', () => {
    lines = [line(2)];
    show();
    expect(screen.getByText('2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tambah jumlah' }));
    expect(cart.setQty).toHaveBeenCalledWith('p1:', 3);
  });
});
